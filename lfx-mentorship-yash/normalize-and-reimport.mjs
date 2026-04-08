/**
 * normalize-and-reimport.mjs
 * 
 * 1. Read lfx_cleaned (1).csv
 * 2. Apply normalization map to consolidate org names
 * 3. Save normalized CSV
 * 4. Re-import into MongoDB (drop + rebuild all 3 collections)
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
try {
  const envPath = join(__dirname, '..', '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx);
      const val = trimmed.slice(eqIdx + 1);
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {}

const DB_NAME = 'lfx-mentorship-yash';

// ════════════════════════════════════════════════════════════════════
//  NORMALIZATION MAP: variant orgName → [canonical orgName, foundation]
//  If foundation is null, keep original from CSV.
// ════════════════════════════════════════════════════════════════════
const NORMALIZE = {
  // ── CNCF duplicates / variants ─────────────────────────────────
  "Meshery/Smi": ["Meshery", null],
  "Thanos Compactor": ["Thanos", null],
  "Knative Eventing": ["Knative", null],
  "Krkn - Chaos": ["Krkn", null],
  "Konveyor Ai": ["Konveyor", null],
  "Cloud Native Buildpacks": ["Buildpacks", null],
  "Cncf Landscape": ["CNCF Landscape", null],
  "Cncf Tag Network": ["CNCF TAG Network", null],
  "Cncf": ["CNCF (General)", null],
  "Tag Contributor Strategy": ["CNCF TAG Contributor Strategy", null],
  "Tag Network": ["CNCF TAG Network", null],
  "Tag Network And Observability": ["CNCF TAG Network", null],
  "Sample Project": ["CNCF (General)", null],
  "Spiffe/Spire": ["SPIFFE/SPIRE", null],
  "Service Mesh Interface": ["Service Mesh Interface", null],
  "Service Mesh Performance": ["Service Mesh Performance", null],
  "Podman Container Tools": ["Podman", null],
  "Kube State Metrics": ["Kube State Metrics", null],
  "K8Sgpt": ["K8sGPT", null],

  // ── SONiC projects → SONiC ─────────────────────────────────────
  "Bgp-Ls Cli Dev & Testing On 7-Node Vsonic Topo": ["SONiC", "Linux Foundation"],
  "Enable Isis Functionality On Sonic": ["SONiC", "Linux Foundation"],
  "Formal Methods For Comprehensive Testing Of Bgp Link-State": ["SONiC", "Linux Foundation"],
  "Formal Methods For Refactoring": ["SONiC", "Linux Foundation"],
  "Mirror Serial Console Traffic In Sonic": ["SONiC", "Linux Foundation"],
  "Multi-Asic T1 And T2 Pr Checker": ["SONiC", "Linux Foundation"],
  "Sonic Test Runtime Optimization": ["SONiC", "Linux Foundation"],
  "Top-N Interface Traffic Visibility Feature In Sonic": ["SONiC", "Linux Foundation"],
  "Using Formal Methods For Comprehensive Malformed Packet Handling In Bgp Implementations": ["SONiC", "Linux Foundation"],
  "Netlink Optimization For Sonic Lag": ["SONiC", "Linux Foundation"],
  "Shadow Analytics Via Redis Replica": ["SONiC", "Linux Foundation"],
  "Simplify Platform And Device Management": ["SONiC", "Linux Foundation"],
  "Platform Driver Development Framework Improvements": ["SONiC", "Linux Foundation"],

  // ── Hyperledger Fabric ─────────────────────────────────────────
  "Making Chaincode Fault Tolerant Software": ["Hyperledger Fabric", "LF Decentralized Trust"],
  "Runtime-Checked Automated Programming For Chaincode Development": ["Hyperledger Fabric", "LF Decentralized Trust"],
  "Support Nft Standards In Weaver For Cross-Network Asset Operations": ["Hyperledger Fabric", "LF Decentralized Trust"],

  // ── Hyperledger Besu ───────────────────────────────────────────
  "Continuous Benchmarking For Besu Evm": ["Hyperledger Besu", "LF Decentralized Trust"],
  "Refactoring And Evolution Of The Besu Plugin Api": ["Hyperledger Besu", "LF Decentralized Trust"],
  "Client Connector For Hyperledger Besu": ["Hyperledger Besu", "LF Decentralized Trust"],
  "Hyperledger Besu - Create K8 / Openshift Operators": ["Hyperledger Besu", "LF Decentralized Trust"],
  "Learning Tokens @ Hyperledger Besu": ["Hyperledger Besu", "LF Decentralized Trust"],

  // ── Hyperledger Cacti / Cactus ─────────────────────────────────
  "Improve Usability, Maintainability, And Contributor Experience Of Hyperledger Cacti": ["Hyperledger Cacti", "LF Decentralized Trust"],
  "Hyperledger Cacti - Core Operators Modules For Dlts": ["Hyperledger Cacti", "LF Decentralized Trust"],
  "Hyperledger Cactus - Cactus-Samples - Business Logic Plugins For Hyperledger Cactus": ["Hyperledger Cacti", "LF Decentralized Trust"],
  "Technical Deep Dive Workshop Content Creation For Hyperledger Cactus": ["Hyperledger Cacti", "LF Decentralized Trust"],
  "Cacti - Polkadot Connector": ["Hyperledger Cacti", "LF Decentralized Trust"],
  "Cacti - Implement Standardized Secure Asset Transfer Protocol": ["Hyperledger Cacti", "LF Decentralized Trust"],
  "Cacti - Ledger Data Sharing With Proof In Besu And Ethereum": ["Hyperledger Cacti", "LF Decentralized Trust"],
  "Cactus And Hedera Hashgraph Integration": ["Hyperledger Cacti", "LF Decentralized Trust"],
  "Chia Connector For Hyperledger Cactus": ["Hyperledger Cacti", "LF Decentralized Trust"],
  "Improvement In Hlf-Connector, Hardening The Production Readiness Aspects": ["Hyperledger Cacti", "LF Decentralized Trust"],
  "Extend Existing Iroha - Cactus Integration": ["Hyperledger Cacti", "LF Decentralized Trust"],

  // ── Hyperledger Iroha ──────────────────────────────────────────
  "Iroha 1": ["Hyperledger Iroha", "LF Decentralized Trust"],
  "Iroha 2 Dsl": ["Hyperledger Iroha", "LF Decentralized Trust"],
  "Iroha 2 Ffi Client Library Bindings": ["Hyperledger Iroha", "LF Decentralized Trust"],
  "Iroha 2 Blockchain Explorer Update": ["Hyperledger Iroha", "LF Decentralized Trust"],
  "Implement Iroha-Cpp Library For Hyperledger Iroha 1": ["Hyperledger Iroha", "LF Decentralized Trust"],
  "Hyperledger Iroha + Burrow - Extend Existing Solidity Vm Integration": ["Hyperledger Iroha", "LF Decentralized Trust"],
  "Hyperledger Iroha + Cactus - Integration": ["Hyperledger Iroha", "LF Decentralized Trust"],
  "Hyperledger Iroha - Blueprint-Like Interface For Iroha Special Instructions": ["Hyperledger Iroha", "LF Decentralized Trust"],
  "Hyperledger Iroha - Extend Hl Iroha Queries With Optional Arguments": ["Hyperledger Iroha", "LF Decentralized Trust"],
  "Hyperledger Iroha - Integration With Hyperledger Quilt": ["Hyperledger Iroha", "LF Decentralized Trust"],
  "Hyperledger Iroha - Making Data Model Modular For Interoperability With Other Projects": ["Hyperledger Iroha", "LF Decentralized Trust"],
  "Hyperledger Iroha - Reworking Consensus Api": ["Hyperledger Iroha", "LF Decentralized Trust"],

  // ── Hyperledger Solang ─────────────────────────────────────────
  "Hyperledger Solang": ["Hyperledger Solang", "LF Decentralized Trust"],
  "Hyperledger Solang - Implement Two Compiler Passes For The Solang Solidity Compiler": ["Hyperledger Solang", "LF Decentralized Trust"],
  "Hyperledger Solang -Create A New Solidity Language Server  Using Solang Compiler": ["Hyperledger Solang", "LF Decentralized Trust"],
  "Implement An Ssa Intermediate Representation For The Solang Compiler": ["Hyperledger Solang", "LF Decentralized Trust"],
  "Implement A Cli For Node Interactions In Hyperledger Solang": ["Hyperledger Solang", "LF Decentralized Trust"],
  "Improving Hyperledger Solang Through Comparative Analysis With The Soroban Rust Sdk": ["Hyperledger Solang", "LF Decentralized Trust"],
  "Make Solidity Language Server Functional": ["Hyperledger Solang", "LF Decentralized Trust"],
  "Solang Solidity Compiler Optimizations And Error Handling": ["Hyperledger Solang", "LF Decentralized Trust"],

  // ── Hyperledger Umbra ──────────────────────────────────────────
  "Hyperledger Umbra - Adding Network Fuzzing Capabilities": ["Hyperledger Umbra", "LF Decentralized Trust"],
  "Hyperledger Umbra - Chaos Monkey Engineering In Umbra Scalability Tests": ["Hyperledger Umbra", "LF Decentralized Trust"],
  "Hyperledger Umbra - Scaling Experiments": ["Hyperledger Umbra", "LF Decentralized Trust"],

  // ── Hyperledger Caliper ────────────────────────────────────────
  "Hyperledger Caliper - Declarative Workload Behavior Definition For Hyperledger Caliper": ["Hyperledger Caliper", "LF Decentralized Trust"],
  "Hyperledger Caliper Documentation Platform Update": ["Hyperledger Caliper", "LF Decentralized Trust"],
  "Hyperledger Caliper Testability And Robustness Improvement": ["Hyperledger Caliper", "LF Decentralized Trust"],
  "Optimising Pipelines Using Github Actions For Caliper And Caliper-Benchmarks": ["Hyperledger Caliper", "LF Decentralized Trust"],
  "Performance Analysis And Benchmarking Of Besu Using Caliper With Complex Workloads": ["Hyperledger Caliper", "LF Decentralized Trust"],
  "Visual Studio Code Support For Hyperledger Caliper Artifacts": ["Hyperledger Caliper", "LF Decentralized Trust"],

  // ── Hyperledger Cello ──────────────────────────────────────────
  "Hyperledger Cello - Operate Blockchain Network In An Efficient Way": ["Hyperledger Cello", "LF Decentralized Trust"],
  "Hyperledger Cello - Operate And Govern Blockchain Networks In Decentralized Way": ["Hyperledger Cello", "LF Decentralized Trust"],

  // ── Hyperledger Indy ───────────────────────────────────────────
  "Hyperledger Indy -Secure Did Registry On Github/Gitlab For Hyperledger Frameworks": ["Hyperledger Indy", "LF Decentralized Trust"],
  "Hyperledger Indy Read Replica Implementation": ["Hyperledger Indy", "LF Decentralized Trust"],

  // ── Hyperledger Bevel ──────────────────────────────────────────
  "Hyperledger Bevel Documentation Redesign": ["Hyperledger Bevel", "LF Decentralized Trust"],
  "Deploy Carbon Accounting Network With Bevel": ["Hyperledger Bevel", "LF Decentralized Trust"],
  "Demonstrate Interoperability Using Hyperledger Bevel And Cactus": ["Hyperledger Bevel", "LF Decentralized Trust"],

  // ── Hyperledger AnonCreds ──────────────────────────────────────
  "Hyperledger Anoncreds V2 Zkp-Based Credential Revocation Manager Implementation": ["Hyperledger AnonCreds", "LF Decentralized Trust"],
  "Document, Review, And Implement Hyperledger Anoncreds Zkp Cryptographic Primitives": ["Hyperledger AnonCreds", "LF Decentralized Trust"],

  // ── Hyperledger Aries ──────────────────────────────────────────
  "Aries-Vcx Based Message Mediator": ["Hyperledger Aries", "LF Decentralized Trust"],
  "Aries-Vcx Next-Gen Mobile Wrapper": ["Hyperledger Aries", "LF Decentralized Trust"],

  // ── Hyperledger Web3j ──────────────────────────────────────────
  "Hyperledger Web3J": ["Hyperledger Web3j", "LF Decentralized Trust"],
  "Web3J Libraries Full Lifecycle Development": ["Hyperledger Web3j", "LF Decentralized Trust"],

  // ── Hyperledger Identus ────────────────────────────────────────
  "Hyperledger Identus - Identity Portal": ["Hyperledger Identus", "LF Decentralized Trust"],

  // ── Hyperledger Explorer ───────────────────────────────────────
  "Explorer User Interface Redesign": ["Hyperledger Explorer", "LF Decentralized Trust"],

  // ── Hyperledger (generic / community) ──────────────────────────
  "Hyperledger": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Hyperledger Contribution And Community Engagement Video Series Mentorship": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Onboarding Mentor And Mentee Program": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Developer Marketing": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Documentation Standards": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Documentation And Use Cases For Climate Action": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Ecosystem Analyst": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Global Scouting Of Dlt / Blockchain Educational Opportunities": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Improve User Experience From Getting Started To Continuous Engagement": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Towards Blockchain Interoperability": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Visualization And Analysis Of Cross-Chain Transactions": ["Hyperledger (General)", "LF Decentralized Trust"],
  "The Use Of Nlp And Dlt To Enable The Digitalization Of Telecom Roaming Agreements": ["Hyperledger (General)", "LF Decentralized Trust"],

  // ── Hyperledger Collaborative Learning ─────────────────────────
  "Hyperledger Collaborative Learning - A Distributed Smart Contract Management - Unpaid": ["Hyperledger Collaborative Learning", "LF Decentralized Trust"],
  "Hyperledger Collaborative Learning - Design And Spec Didman Based Openwallet - Unpaid": ["Hyperledger Collaborative Learning", "LF Decentralized Trust"],
  "Hyperledger Collaborative Learning - Extend Drman & Gitvcr For Gitlab - Unpaid": ["Hyperledger Collaborative Learning", "LF Decentralized Trust"],
  "Hyperledger Collaborative Learning - Improve Documentation For Drman - Unpaid": ["Hyperledger Collaborative Learning", "LF Decentralized Trust"],
  "Hyperledger Collaborative Learning - Semantic Tools For Interoperable Climate Accounting - Unpaid": ["Hyperledger Collaborative Learning", "LF Decentralized Trust"],
  "Hyperledger Collaborative Learning - Student Chapter Society Onboarding And Engagement - Unpaid": ["Hyperledger Collaborative Learning", "LF Decentralized Trust"],

  // ── Other LFDT projects ────────────────────────────────────────
  "Hyperledger Labs Ai-Faq Llm Chatbot Gui Implementation And Prototype Deployment": ["Hyperledger Labs", "LF Decentralized Trust"],
  "Fablo": ["Fablo", "LF Decentralized Trust"],
  "Learning Tokens": ["Learning Tokens", "LF Decentralized Trust"],
  "Learning Tokens @ Hyperledger Besu": ["Learning Tokens", "LF Decentralized Trust"],
  "The Giving Chain": ["The Giving Chain", "LF Decentralized Trust"],
  "Telecom Decentralized Identities Network": ["Telecom Decentralized Identities", "LF Decentralized Trust"],
  "Decentralized Identity Management For Trusted Interoperation": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Blockchain Network Operation In A Decentralized Way": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Cross-Chain State Modelling And Analysis": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Implement Cross Chain Contract Invocation Using 'Servicemesh' Way": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Benchmarking Cross-Chain Bridges": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Design/Development Of A Mini Game To Explore Decentralized Identity & Payments": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Automated Fault-Tolerant Htlc For Cross-Chain Atomic Asset Exchange": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Automated Testing For Climate Emissions Ledger": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Automated Gateways Through Smart Contracts": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Research Composable Token Primitives For Post-Trade Clearing, Settlement, Compliance On Dlt": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Gvcr": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Drman Utility To Provision And Administer Did Based Verifiable Credential Registries": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Git Commit Signing With Did'S, Part Deux": ["Hyperledger (General)", "LF Decentralized Trust"],
  "Extend Secure Did Registry For Hyperledger Frameworks On Github/Gitlab": ["Hyperledger (General)", "LF Decentralized Trust"],

  // ── Hiero ──────────────────────────────────────────────────────
  "Hiero": ["Hiero", "Linux Foundation"],
  "Hiero Github Workflow App": ["Hiero", "Linux Foundation"],
  "Extending Hiero Enterprise Java With Smart Contract Event And Log Apis": ["Hiero", "Linux Foundation"],

  // ── Paladin / LF Decentralized Trust misc ──────────────────────
  "Build And Release A Java Sdk For Paladin": ["Paladin", "LF Decentralized Trust"],
  "Advanced Threshold Key Management": ["Paladin", "LF Decentralized Trust"],
  "Implement Dkls23  Protocol": ["Paladin", "LF Decentralized Trust"],
  "T-Claw": ["Paladin", "LF Decentralized Trust"],

  // ── Zowe → consolidate all Zowe variants ───────────────────────
  "Zowe - App Store Ui": ["Zowe", "Linux Foundation"],
  "Zowe - Metrics Dashboard For Ml Services": ["Zowe", "Linux Foundation"],
  "Zowe App Framework - File Transfer Application": ["Zowe", "Linux Foundation"],
  "Zowe App Framework \u2013 App Generator": ["Zowe", "Linux Foundation"],
  "Zowe Client Java Sdk": ["Zowe", "Linux Foundation"],
  "Zowe Desktop Application State Persistence Mechanism": ["Zowe", "Linux Foundation"],
  "Zowe Desktop Documentation Viewer": ["Zowe", "Linux Foundation"],
  "Zowe Explorer Extension Templates": ["Zowe", "Linux Foundation"],
  "Zowe Parsing Engine For Smf Or Rmf Pp Reports": ["Zowe", "Linux Foundation"],
  "Zowe Toolkit Plugin For Intellij": ["Zowe", "Linux Foundation"],
  "Improve The Zowe Doc Site Generator And Ui": ["Zowe", "Linux Foundation"],
  "Slack To Zowe Integration": ["Zowe", "Linux Foundation"],
  "Go Sdk For Zowe": ["Zowe", "Linux Foundation"],

  // ── Open Mainframe Project consolidation ───────────────────────
  "Mainframe Open Education Core Team": ["Mainframe Open Education", "Linux Foundation"],
  "Mainframe Open Education Project": ["Mainframe Open Education", "Linux Foundation"],
  "Enhancing Marketing And Communication For Mainframe Open Education": ["Mainframe Open Education", "Linux Foundation"],
  "Mainframe Modernization Video Series": ["Mainframe Modernization", "Linux Foundation"],
  "Mainframe Modernization White Paper": ["Mainframe Modernization", "Linux Foundation"],
  "Mainframe Modernization Whitepaper": ["Mainframe Modernization", "Linux Foundation"],
  "Role Of Ai In Mainframe Application Modernization": ["Mainframe Modernization", "Linux Foundation"],
  "Role Of Mainframes In Digital Sovereignty And Resilience": ["Mainframe Modernization", "Linux Foundation"],
  "Drive Mainframe Modernization With Agentic Ai": ["Mainframe Modernization", "Linux Foundation"],
  "Ai Powered Mainframe Data Modernization": ["Mainframe Modernization", "Linux Foundation"],
  "Hybrid It With Mainframes And Cloud": ["Mainframe Modernization", "Linux Foundation"],
  "Cobol Programming Course Hands-On Lab Development": ["COBOL Programming Course", "Linux Foundation"],
  "Cobol Programming Course Updates": ["COBOL Programming Course", "Linux Foundation"],
  "Cobol Programming Course": ["COBOL Programming Course", "Linux Foundation"],
  "Cobol Modernization": ["COBOL Programming Course", "Linux Foundation"],
  "Addressing The Cobol \"Crisis\"": ["COBOL Programming Course", "Linux Foundation"],
  "Cics And Laptop Option For Cobol Programming Course": ["COBOL Programming Course", "Linux Foundation"],
  "Bringing Open Source To Mainframes": ["Open Mainframe Project", "Linux Foundation"],
  "Give Love To The Bugs List": ["Open Mainframe Project", "Linux Foundation"],
  "Rag To Riches - Using Your Legacy Data": ["Open Mainframe Project", "Linux Foundation"],
  "White Paper": ["Open Mainframe Project", "Linux Foundation"],
  "Finalize React Front-End": ["Open Mainframe Project", "Linux Foundation"],
  "Z/Vm And Linux Modern Administration": ["Open Mainframe Project", "Linux Foundation"],
  "Zos Performance Monitoring": ["Open Mainframe Project", "Linux Foundation"],
  "Zorow - Byo Z/Osmf Workflow": ["Open Mainframe Project", "Linux Foundation"],

  // ── Zebra ──────────────────────────────────────────────────────
  "Zebra Javascript Application": ["Zebra", "Linux Foundation"],
  "Zebra Plugin For Hitachi Mainframe Storage": ["Zebra", "Linux Foundation"],

  // ── Galasa ─────────────────────────────────────────────────────
  "Galasa Github Actions Build Process": ["Galasa", "Linux Foundation"],
  "Galasa Test Run Web User Interface": ["Galasa", "Linux Foundation"],

  // ── Feilong ────────────────────────────────────────────────────
  "Improve Feilong Packaging Process": ["Feilong", "Linux Foundation"],
  "Feilong - Ansible Module": ["Feilong", "Linux Foundation"],

  // ── z/OS misc ──────────────────────────────────────────────────
  "Inzpect": ["Open Mainframe Project", "Linux Foundation"],
  "Software Discovery Tool - Add Z/Os Support": ["Open Mainframe Project", "Linux Foundation"],
  "Ade - Add Additional Log Support": ["Open Mainframe Project", "Linux Foundation"],
  "Enabling Ibm Z In Mlmodelscope": ["Open Mainframe Project", "Linux Foundation"],
  "Enhance Zvm Prometheus Exporter": ["Open Mainframe Project", "Linux Foundation"],
  "Kube Cf - Endgame Platform On Z": ["Open Mainframe Project", "Linux Foundation"],
  "Polycephaly": ["Polycephaly", "Linux Foundation"],
  "Port & Polish": ["Open Mainframe Project", "Linux Foundation"],

  // ── OpenDaylight ───────────────────────────────────────────────
  "2023 Opendaylight Website Refresh": ["OpenDaylight", "Linux Foundation"],
  "2023 Opendaylight'S Ci Pipelines And Containers Modernization": ["OpenDaylight", "Linux Foundation"],
  "Modernize Opendaylight'S Ci Pipelines And Containers": ["OpenDaylight", "Linux Foundation"],
  "New Opendaylight Csit Framework": ["OpenDaylight", "Linux Foundation"],
  "Lf Networking Odl -Json Examples For Odl User Guides": ["OpenDaylight", "Linux Foundation"],

  // ── FD.io ──────────────────────────────────────────────────────
  "2023 Fd.Io Website Ux Improvements": ["FD.io", "Linux Foundation"],

  // ── ONAP ───────────────────────────────────────────────────────
  "Lf Networking Onap - Automation Testing - Portal/Sdc": ["ONAP", "Linux Foundation"],
  "Lf Networking Onap - Etsi Nfv Apis Conformance Test For Ovp": ["ONAP", "Linux Foundation"],
  "Lf Networking Onap - Modeling/Etsicatalog": ["ONAP", "Linux Foundation"],
  "Lf Networking Onap - Security Requirements - Sdc": ["ONAP", "Linux Foundation"],

  // ── OPNFV ──────────────────────────────────────────────────────
  "Lf Networking Opnfv - Barometer Ci Development And Test Case Creation": ["OPNFV", "Linux Foundation"],
  "Lf Networking Opnfv - Hardware Delivery Verification Tool Development And Testing": ["OPNFV", "Linux Foundation"],
  "Lf Networking Opnfv - Log-Analysis And Alerting For Opnfv-Vsperf": ["OPNFV", "Linux Foundation"],
  "Lf Networking Opnfv - Software Delivery Verification Tool Development And Testing": ["OPNFV", "Linux Foundation"],
  "Opnfv Internship": ["OPNFV", "Linux Foundation"],
  "Anuket Ai/Ml Models For Nfv Usecases R&D": ["OPNFV", "Linux Foundation"],

  // ── RISC-V ─────────────────────────────────────────────────────
  "Risc-V Mentorship": ["RISC-V", "Linux Foundation"],
  "Risc-V Education Apprenticeship": ["RISC-V", "Linux Foundation"],
  "Risc-V Engagement Apprenticeship": ["RISC-V", "Linux Foundation"],
  "Risc-V Audiomark": ["RISC-V", "Linux Foundation"],
  "Risc-V Processor Certification": ["RISC-V", "Linux Foundation"],
  "Risc-V Vector Coprocessor For Ecg Detection On Uet-Rvmcu": ["RISC-V", "Linux Foundation"],
  "Ai-Assisted Extraction Of Architectural Parameters From Risc-V Specifications": ["RISC-V", "Linux Foundation"],
  "Alternate Numerical Notations For Risc-V": ["RISC-V", "Linux Foundation"],
  "Add F-Extension Support To \"Ripes\" Risc-V Micro-Architectural Visual Educational Simulator": ["RISC-V", "Linux Foundation"],
  "Improve Risc-V Software Ecosystem Verification": ["RISC-V", "Linux Foundation"],
  "Create A Workload Analysis Flow Using Risc-V Olympia Performance Model": ["RISC-V", "Linux Foundation"],
  "Creating An Execution-Driven Version Of Olympia, The Performance Model Of Example Risc-V Superscalar": ["RISC-V", "Linux Foundation"],
  "Enhancement To Olympia": ["RISC-V", "Linux Foundation"],
  "Performance Model Of An Example Risc-V Out-Of-Order Superscalar Processor For Community-Wide Use": ["RISC-V", "Linux Foundation"],
  "Hardware Abstraction Layer Transitional Library For Software To Hardware Posits For Risc-V": ["RISC-V", "Linux Foundation"],
  "Hardware Abstraction Layer Transitional Library For Software To Hardware Posits For Risc-V - Part Ii": ["RISC-V", "Linux Foundation"],
  "Accelerating Risc-V Vector Instructions By Using A Bionic Network Design": ["RISC-V", "Linux Foundation"],
  "Random Test Generation For Risc-V Vector Extension": ["RISC-V", "Linux Foundation"],
  "Refactoring And Enhancing The Risc-V Opcodes Repository": ["RISC-V", "Linux Foundation"],
  "Feature Optimizations For Riscv-Ctg And Riscv-Isac": ["RISC-V", "Linux Foundation"],
  "Feature Optimizations For Riscv-Ctg  And Riscv-Isac (Riscv Isa Coverag": ["RISC-V", "Linux Foundation"],
  "Porting Aosp 12 Emulator To Risc-V Rv64G": ["RISC-V", "Linux Foundation"],
  "Syscall Intercept For Risc-V": ["RISC-V", "Linux Foundation"],
  "Syzkaller On Freebsd/Risc-V": ["RISC-V", "Linux Foundation"],
  "Supervisor Domains Priv. Isa Extension Emulation": ["RISC-V", "Linux Foundation"],
  "Sail To Cgen": ["RISC-V", "Linux Foundation"],
  "Developing Risc-V With Next Generation Arithmetic  Capabilities": ["RISC-V", "Linux Foundation"],
  "Cache Architecture Between Gowin'S Risc-V Processor Ip Cores And Gowin'S Embedded Psram Controller I": ["RISC-V", "Linux Foundation"],
  "Compressed Instructions For Serv": ["RISC-V", "Linux Foundation"],
  "Specification Encoder": ["RISC-V", "Linux Foundation"],
  "Idl Writer / Verification": ["RISC-V", "Linux Foundation"],

  // ── NucleusRV ──────────────────────────────────────────────────
  "Atomic Nucleusrv": ["NucleusRV", "Linux Foundation"],
  "Adding Single Precision Floating Point  Extension In Nucleusrv Core": ["NucleusRV", "Linux Foundation"],
  "Implementing Rvv V1.0 Floating Point Vector Instructions In Nucleusrv Core": ["NucleusRV", "Linux Foundation"],
  "Implement Tilelink Uncached Heavyweight  In Caravan Framework": ["NucleusRV", "Linux Foundation"],

  // ── Misc consolidations ────────────────────────────────────────
  "Repository Service For Tuf": ["Repository Service for TUF", "Linux Foundation"],
  "Repository Service For Tuf  2026": ["Repository Service for TUF", "Linux Foundation"],
  "Gittuf": ["Gittuf", "Linux Foundation"],
  "Gittuf-2026": ["Gittuf", "Linux Foundation"],
  "Sbomit 2026": ["SBOMit", "Linux Foundation"],
  "Minder 2026": ["Minder", "Linux Foundation"],
  "Sailing Downstream": ["Sailing Downstream", "Linux Foundation"],
  "Sailing Downstream Ii": ["Sailing Downstream", "Linux Foundation"],
  "Sailing Downstream Iii": ["Sailing Downstream", "Linux Foundation"],
  "Ccc - Certifier Framework": ["CCC Certifier", "Linux Foundation"],
  "Ccc - Veraison": ["Veraison", "Linux Foundation"],
  "Ccc - Islet": ["CCC Islet", "Linux Foundation"],
  "Veraison": ["Veraison", "Linux Foundation"],
  "Core-V Wally Technology Readiness Level 5": ["CORE-V Wally", "Linux Foundation"],
  "Lorariscv": ["LoRaRISCV", "Linux Foundation"],
  "Uetrv Picocore": ["UETRV PicoCore", "Linux Foundation"],
  "Verilator Vpi Array Value Accessor": ["Verilator", "Linux Foundation"],
  "Newlib Optimization": ["Newlib", "Linux Foundation"],
  "Xdp Redirect": ["XDP", "Linux Foundation"],
  "Pasta": ["PASTA", "Linux Foundation"],

  // ── OpenHPC ────────────────────────────────────────────────────
  "Openhpc Mentorship": ["OpenHPC", "Linux Foundation"],
  "Openhpc Summer Mentorship 2022": ["OpenHPC", "Linux Foundation"],

  // ── OSPO / Open@RIT ────────────────────────────────────────────
  "Open@Rit - University Ospo Methodologies Research": ["Open@RIT", "Linux Foundation"],
  "Open@Rit - University Ospo Playbook": ["Open@RIT", "Linux Foundation"],
  "Ospo Playbook": ["Open@RIT", "Linux Foundation"],

  // ── Cloudforet ─────────────────────────────────────────────────
  "Cloudforet Naver Cloud Plugin Development - Unpaid 2023 Mentorship Program": ["Cloudforet", "Linux Foundation"],
  "Cloudforet Nhn Cloud Plugin Development - Unpaid 2024 Mentorship Program": ["Cloudforet", "Linux Foundation"],
  "Cloudforet Plugin Development - Unpaid 2023 Mentorship Program": ["Cloudforet", "Linux Foundation"],

  // ── LFX / LF general ──────────────────────────────────────────
  "Lfx Engineering Mentorship": ["LFX Mentorship", "Linux Foundation"],
  "Lf Research": ["LF Research", "Linux Foundation"],
  "Lf Energy - Hyphae Apis": ["LF Energy", "Linux Foundation"],
  "All In": ["All In", "Linux Foundation"],
  "Google Season Of Documentation": ["Google Season of Docs", "Linux Foundation"],
  "Patchwork Tool Development Unpaid 2023": ["Patchwork", "Linux Foundation"],
  "Dpu Operator Enhancement": ["DPU Operator", "Linux Foundation"],
  "L3Af On Windows": ["L3AF", "Linux Foundation"],
  "Cloud Native Measurement, Reporting And Validation Of Carbon Emissions": ["LF Carbon Measurement", "Linux Foundation"],
  "Integrated Cloud Native Reference Stack For Edge Use Cases": ["LF Edge", "Linux Foundation"],
  "Basic Azure Pipeline With Alpine And Kne": ["KNE", "Linux Foundation"],
  "Cdp 2-Way Communications": ["CDP", "Linux Foundation"],
  "My Conservation Life": ["My Conservation Life", "Linux Foundation"],
  "Using Machine Learning To Predict Deforestation": ["LF Climate", "Linux Foundation"],
  "Wrapping Proprietary Printer Drivers Into A Printer Application Support For Ipp Fax Out.": ["Open Printing", "Linux Foundation"],
  "Ruby Tools Developer": ["Ruby", "Linux Foundation"],
  "Soda Api": ["SODA", "Linux Foundation"],
  "Code Gen": ["Code Gen", "Linux Foundation"],
  "Codeuino Mentorship": ["Codeuino", "Linux Foundation"],
  "Confidential Computing Fellowship": ["CCC", "Linux Foundation"],
  "Contributing To First Stable Release Of Mldsa-Native": ["MLDSA", "Linux Foundation"],
  "Mldsa-Native And Mlkem-Native": ["MLDSA", "Linux Foundation"],
  "Enhancing Constant-Time Analysis Tooling In Liboqs": ["liboqs", "Linux Foundation"],
  "Openbao - Cryptographic Mentorship": ["OpenBao", "Linux Foundation"],
  "Coccinelle For Rust": ["Coccinelle", "Linux Foundation"],

  // ── FINOS ──────────────────────────────────────────────────────
  "Finos Accessibility Theme Builder Mentorship": ["FINOS", "Linux Foundation"],
  "Finos Marketing": ["FINOS", "Linux Foundation"],
  "Electron Fdc3": ["FINOS", "Linux Foundation"],

  // ── O-RAN ──────────────────────────────────────────────────────
  "O-Ran-Sc Code Quality Improvement": ["O-RAN SC", "Linux Foundation"],
  "Cloud-Native O-Ran": ["O-RAN SC", "Linux Foundation"],

  // ── SPDX ───────────────────────────────────────────────────────
  "Spdx Online Tools": ["SPDX", "Linux Foundation"],

  // ── GenevaERS ──────────────────────────────────────────────────
  "Genevaers Demo System": ["GenevaERS", "Linux Foundation"],

  // ── Misc small ones ────────────────────────────────────────────
  "Healthcare-Centric Edge-Ai Development On Rvmcu Architecture": ["RISC-V", "Linux Foundation"],
  "Hypereldger - Support Clique For Besu On Hl Labs Baf": ["Hyperledger Besu", "LF Decentralized Trust"],
  "Graphql Mentorship": ["GraphQL", "Linux Foundation"],
  "Atom Syntax Highlighting": ["Open Mainframe Project", "Linux Foundation"],
  "Jaeger Mentorship": ["Jaeger", "Linux Foundation"],
  "Chaos Mesh": ["Chaos Mesh", null],
  "Openebs": ["OpenEBS", null],
  "Openelb": ["OpenELB", null],
  "Openfunction": ["OpenFunction", null],
  "Opentelemetry": ["OpenTelemetry", null],
  "Openyurt": ["OpenYurt", null],
  "Opencost": ["OpenCost", null],
  "Openkruise": ["OpenKruise", null],
  "Litmuschaos": ["LitmusChaos", null],
  "Cloudnativepg": ["CloudNativePG", null],
  "Wasmedge": ["WasmEdge", null],
  "Kubeedge": ["KubeEdge", null],
  "Kubearmor": ["KubeArmor", null],
  "Kubeslice": ["KubeSlice", null],
  "Kubestellar": ["KubeStellar", null],
  "Kubevela": ["KubeVela", null],
  "Kubewarden": ["Kubewarden", null],
  "Kubevirt": ["KubeVirt", "Linux Foundation"],
  "Coredns": ["CoreDNS", null],
  "Tikv": ["TiKV", null],
  "Etcd": ["etcd", null],
  "Kcl": ["KCL", null],
  "Kwok": ["KWOK", null],
  "Fluentd": ["Fluentd", "Linux Foundation"],
  "Envoy": ["Envoy", "Linux Foundation"],
  "Jenkins": ["Jenkins", "Linux Foundation"],
  "Keptn": ["Keptn", null],
  "Klever": ["Klever", "Linux Foundation"],
  "Mailu": ["Mailu", "Linux Foundation"],
  "Mixcore": ["Mixcore", "Linux Foundation"],
  "Todogroup": ["TODO Group", "Linux Foundation"],
  "Magma Core": ["Magma", "Linux Foundation"],
  "Linkerd": ["Linkerd", null],
  "Aether Mentorship Program": ["Aether", "Linux Foundation"],
  "Alpha-Omega": ["Alpha-Omega", "Linux Foundation"],
  "Kagent": ["Kagent", null],
  "Kgateway": ["kgateway", null],
  "Copacetic": ["Copacetic", null],
  "Drasi": ["Drasi", null],
  "Envoy Gateway": ["Envoy Gateway", null],
  "Fluid": ["Fluid", null],
  "Headlamp": ["Headlamp", null],
  "Pipecd": ["PipeCD", null],
  "Urunc": ["Urunc", null],
  "Strimzi": ["Strimzi", null],
  "Testgrid": ["TestGrid", null],
  "Cartography": ["Cartography", null],
  "Pixie": ["Pixie", null],
  "Racklet": ["Racklet", null],
  "Nats": ["NATS", null],
  "Notary": ["Notary", null],
  "Oras": ["ORAS", null],
  "Carvel": ["Carvel", null],
  "Devfile": ["Devfile", null],
  "Flux": ["Flux", null],
  "In-Toto": ["in-toto", null],
  "Tuf": ["TUF", null],
  "Kube-Burner": ["Kube-Burner", null],
};

// ════════════════════════════════════════════════════════════════════
//  HELPERS (same as import-from-csv.mjs)
// ════════════════════════════════════════════════════════════════════
function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

function getSeason(month) {
  if (month >= 1 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  return 'fall';
}

function buildTermRef(pt) {
  const startDate = new Date(pt.startDateTime * 1000);
  const endDate = new Date(pt.endDateTime * 1000);
  const year = startDate.getFullYear();
  const season = getSeason(startDate.getMonth() + 1);
  const now = Date.now();
  let status = 'unknown';
  if (endDate.getTime() < now) status = 'complete';
  else if (startDate.getTime() <= now && endDate.getTime() >= now) status = 'ongoing';
  else if (pt.active === 'open') status = 'accepting-applications';
  return {
    id: pt.id, year, season,
    label: `${season.charAt(0).toUpperCase() + season.slice(1)} ${year}`,
    startDate: startDate.toISOString(), endDate: endDate.toISOString(),
    status, menteeCount: pt.activeUsers || 0,
  };
}

const MIN_YEAR = 2021;

function parseCSV(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  const map = new Map();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    let fields;
    if (line.includes('"')) {
      fields = []; let current = ''; let inQ = false;
      for (const ch of line) {
        if (ch === '"') inQ = !inQ;
        else if (ch === ',' && !inQ) { fields.push(current.trim()); current = ''; }
        else current += ch;
      }
      fields.push(current.trim());
    } else {
      fields = line.split(',').map(f => f.trim());
    }
    if (fields.length >= 3) {
      const [projectId, orgName, foundation] = fields;
      if (projectId && orgName) {
        // Apply normalization
        const norm = NORMALIZE[orgName];
        const finalOrg = norm ? norm[0] : orgName;
        const finalFoundation = (norm && norm[1]) ? norm[1] : foundation || 'Linux Foundation';
        map.set(projectId, { orgName: finalOrg, foundation: finalFoundation });
      }
    }
  }
  return map;
}

function transformProjects(rawProjects, orgMap) {
  const results = [];
  for (const raw of rawProjects) {
    if (raw.status !== 'Published') continue;
    const mapping = orgMap.get(raw.projectId);
    if (!mapping) continue;
    const orgSlug = slugify(mapping.orgName);
    if (!orgSlug) continue;
    let proposalTitle = raw.name || '';
    const di = proposalTitle.indexOf(' - ');
    if (di > 0) proposalTitle = proposalTitle.substring(di + 3).trim();
    const ci = proposalTitle.indexOf(':');
    if (ci > 0) proposalTitle = proposalTitle.substring(ci + 1).trim();
    proposalTitle = proposalTitle.replace(/\s*\(\d{4}\s+Term\s+\d\)\s*$/, '').trim();
    if (!proposalTitle) proposalTitle = raw.name || mapping.orgName;
    const skills = raw.apprenticeNeeds?.skills ?? [];
    const mentors = (raw.apprenticeNeeds?.mentors ?? []).map(m => ({
      id: m.id, name: m.name, avatarUrl: m.logoUrl || null, introduction: m.introduction || null,
    }));
    const terms = raw.programTerms ?? [];
    if (terms.length === 0) continue;
    for (const pt of terms) {
      const termYear = new Date(pt.startDateTime * 1000).getFullYear();
      if (termYear < MIN_YEAR) continue;
      results.push({
        id: raw.projectId, slug: raw.slug || slugify(raw.name),
        orgSlug, orgRawName: mapping.orgName, displayName: mapping.orgName,
        foundation: mapping.foundation, orgSource: 'manual-csv',
        title: proposalTitle, fullName: raw.name, description: raw.description || '',
        skills, mentors, mentees: [], term: buildTermRef(pt),
        repoLink: raw.repoLink || null, websiteUrl: raw.websiteUrl || null,
        logoUrl: raw.logoUrl || null, color: raw.color || null,
        _compositeKey: `${raw.projectId}_${pt.id}`,
      });
    }
  }
  return results;
}

function groupOrgs(projects) {
  const orgMap = new Map();
  for (const p of projects) {
    if (!orgMap.has(p.orgSlug)) orgMap.set(p.orgSlug, []);
    orgMap.get(p.orgSlug).push(p);
  }
  const orgs = [];
  for (const [slug, ps] of orgMap) {
    const sorted = [...ps].sort((a, b) => new Date(b.term.startDate) - new Date(a.term.startDate));
    const latest = sorted[0];
    const skillSet = new Set(); ps.forEach(p => p.skills.forEach(s => skillSet.add(s)));
    const termMap = new Map();
    for (const p of ps) {
      if (!p.term) continue;
      const key = p.term.label;
      if (!termMap.has(key)) termMap.set(key, { term: p.term, projectCount: 0, projectIds: [] });
      const e = termMap.get(key); e.projectCount++; e.projectIds.push(p.id);
    }
    const participations = [...termMap.values()].sort((a, b) => {
      if (a.term.year !== b.term.year) return a.term.year - b.term.year;
      return ({ spring: 0, summer: 1, fall: 2 })[a.term.season] - ({ spring: 0, summer: 1, fall: 2 })[b.term.season];
    });
    const yearsSet = new Set(); ps.forEach(p => { if (p.term) yearsSet.add(p.term.year); });
    const yearsActive = [...yearsSet].sort((a, b) => a - b);
    let totalMentees = 0; const seenM = new Set();
    ps.forEach(p => p.mentees.forEach(m => { if (m.status === 'graduated' && !seenM.has(m.id)) { seenM.add(m.id); totalMentees++; } }));
    let description = latest.description || '';
    if (description.length > 300) description = description.substring(0, 297) + '...';
    orgs.push({
      slug, name: latest.orgRawName, displayName: latest.displayName,
      foundation: latest.foundation, orgSource: 'manual-csv', description,
      logoUrl: latest.logoUrl, websiteUrl: latest.websiteUrl, repoLink: latest.repoLink,
      color: latest.color, skills: [...skillSet],
      firstYear: yearsActive[0] || null, lastYear: yearsActive[yearsActive.length - 1] || null,
      totalProjects: ps.length, totalMentees, participations, yearsActive,
    });
  }
  orgs.sort((a, b) => a.name.localeCompare(b.name));
  return orgs;
}

function buildMeta(orgs, projects) {
  const fSet = new Set(), ySet = new Set(), sSet = new Set();
  let totalMentees = 0;
  for (const o of orgs) {
    fSet.add(o.foundation); totalMentees += o.totalMentees;
    o.yearsActive.forEach(y => ySet.add(y));
    o.skills.forEach(s => sSet.add(s));
  }
  return {
    foundations: [...fSet].sort(), years: [...ySet].sort((a, b) => b - a),
    seasons: ['spring', 'summer', 'fall'], skills: [...sSet].sort(),
    totalOrganizations: orgs.length, totalProjects: projects.length,
    totalMentees, sourceStats: { 'manual-csv': orgs.length },
    lastUpdated: new Date().toISOString(),
  };
}

// ══════════════════════════ MAIN ══════════════════════════════════
async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('No MONGODB_URI in .env.local');
  const baseUri = mongoUri.replace(/\/[^/?]+(\?|$)/, `/${DB_NAME}$1`);
  const client = new MongoClient(baseUri.includes(DB_NAME) ? baseUri : mongoUri);
  await client.connect();
  const db = client.db(DB_NAME);

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🧹 Normalize + Re-import (CSV → MongoDB)               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Step 1: Parse + normalize CSV
  console.log('  📄 Step 1: Parsing + normalizing CSV...');
  const csvPath = join(__dirname, 'lfx_cleaned (1).csv');
  const orgMap = parseCSV(csvPath);
  const uniqueOrgs = new Set([...orgMap.values()].map(v => v.orgName));
  console.log(`    ${orgMap.size} projects → ${uniqueOrgs.size} unique orgs (was 404)\n`);

  // Step 2: Fetch raw projects from MongoDB (use the API data we stored earlier)
  // We need to re-fetch from API since we dropped the raw projects
  console.log('  📦 Step 2: Fetching raw projects from API...');
  const BASE = 'https://api.mentorship.lfx.linuxfoundation.org';
  const rawProjects = [];
  let from = 0, total = Infinity;
  while (from < total) {
    const url = `${BASE}/projects/cache/paginate?from=${from}&size=100&sortby=projectStatus&order=asc`;
    let data;
    for (let retry = 0; retry < 3; retry++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json(); break;
      } catch (err) { if (retry === 2) throw err; await new Promise(r => setTimeout(r, 3000)); }
    }
    total = data.hits.total.value;
    rawProjects.push(...data.hits.hits.map(h => h._source));
    from += 100;
    await new Promise(r => setTimeout(r, 150));
  }
  console.log(`    ✅ ${rawProjects.length} raw projects fetched\n`);

  // Step 3: Transform
  console.log('  🔄 Step 3: Transforming...');
  const projects = transformProjects(rawProjects, orgMap);
  console.log(`    ✅ ${projects.length} project-term entries\n`);

  // Step 4: Group
  console.log('  🏢 Step 4: Grouping into organizations...');
  const organizations = groupOrgs(projects);
  console.log(`    ✅ ${organizations.length} organizations\n`);

  // Step 5: Meta
  const meta = buildMeta(organizations, projects);

  // Step 6: Drop + rebuild
  console.log('  💾 Step 6: Rebuilding MongoDB...');
  try { await db.collection('projects').drop(); } catch {}
  try { await db.collection('organizations').drop(); } catch {}
  try { await db.collection('meta').drop(); } catch {}

  let ins = 0;
  for (let i = 0; i < projects.length; i += 500) {
    const batch = projects.slice(i, i + 500);
    const r = await db.collection('projects').insertMany(batch);
    ins += r.insertedCount;
  }
  console.log(`    Projects: ${ins}`);

  const orgR = await db.collection('organizations').insertMany(organizations);
  console.log(`    Organizations: ${orgR.insertedCount}`);

  await db.collection('meta').insertOne({ ...meta, _type: 'meta' });
  console.log(`    Meta: ✓`);

  await db.collection('organizations').createIndex({ slug: 1 }, { unique: true }).catch(() => {});
  await db.collection('projects').createIndex({ orgSlug: 1 }).catch(() => {});
  await db.collection('projects').createIndex({ _compositeKey: 1 }, { unique: true }).catch(() => {});
  console.log('    Indexes: ✓\n');

  // Summary
  const topOrgs = [...organizations].sort((a, b) => b.totalProjects - a.totalProjects).slice(0, 20);
  console.log('  ╔════════════════════════════════════════════════════════╗');
  console.log('  ║                    ✅ ALL DONE!                       ║');
  console.log('  ╚════════════════════════════════════════════════════════╝');
  console.log(`    🏢 ${organizations.length} organizations (down from 404 → ${organizations.length})`);
  console.log(`    📋 ${projects.length} project-term entries`);
  console.log(`    🏛️  Foundations: ${meta.foundations.join(', ')}`);
  console.log(`    📅 Years: ${meta.years.join(', ')}\n`);
  console.log('  📊 Top 20 by project count:');
  for (const o of topOrgs) {
    console.log(`    ${o.totalProjects.toString().padStart(4)} │ ${o.displayName} (${o.foundation})`);
  }
  console.log('');

  await client.close();
}

main().catch(err => { console.error('\n❌', err.message, err.stack); process.exit(1); });
