# LFX Mentorship Organizations

A community-built directory of all organizations participating in the [LFX Mentorship](https://mentorship.lfx.linuxfoundation.org) program by the Linux Foundation.

**Live Site:** [lfxorganizations.onrender.com](https://lfxorganizations.onrender.com)

---

## Inspiration

Finding the right organization in the LFX Mentorship program can be overwhelming. There's no single place to browse, filter, and compare all participating orgs across terms and years. This project is inspired by [gsocorganizations.dev](https://www.gsocorganizations.dev/), which solves the same problem for Google Summer of Code.

We wanted to build the same thing for LFX Mentorship - a clean, searchable directory where aspiring mentees can quickly discover organizations, explore their project history, and find the right fit.

---

## What Problem Does This Solve?

The official LFX Mentorship portal is great for applying, but it doesn't offer:

- **A unified org directory** - browse all organizations in one place
- **Historical data** - see which orgs participated in which terms (2021-present)
- **Advanced filtering** - filter by year, term (Spring/Summer/Fall), foundation (CNCF, Hyperledger, OpenSSF, etc.), or tech skills
- **Sorting options** - sort by most projects, most mentees, most recent activity, or alphabetically
- **Organization profiles** - dedicated pages with project history, participation timelines, and charts

This project fills that gap.

---

## Features

- **Hero dashboard** with aggregate stats (total orgs, projects, mentees)
- **Real-time search** across organization names
- **Multi-filter system** - filter by year, term, foundation, and skills simultaneously
- **Organization detail pages** with historical activity charts (powered by Recharts)
- **Term timeline view** - see all projects grouped by mentorship term
- **Server-side rendering** with Next.js for fast initial loads
- **MongoDB-backed** data layer with 1-hour cache revalidation
- **Automated weekly data refresh** via GitHub Actions
- **Fully responsive** dark-themed UI

---

## Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Framework    | [Next.js 16](https://nextjs.org/)   |
| UI           | React 19, Tailwind CSS v4           |
| Charts       | [Recharts](https://recharts.org/)   |
| Database     | MongoDB Atlas                       |
| Data Source   | LFX Mentorship Public API           |
| Hosting      | [Render](https://render.com/)       |
| CI/CD        | GitHub Actions                      |
| Fonts        | Inter, Space Grotesk (Google Fonts) |

---



## Getting Started

### Prerequisites

- Node.js 20+
- A MongoDB connection string (Atlas or local)

### Installation

```bash
# Clone the repo
git clone https://github.com/Yashagarwal9798/LFXorganizations.git
cd LFXorganizations

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
MONGODB_URI=your_mongodb_connection_string
```

### Seed the Database

Run the data pipeline to fetch all projects from the LFX API and populate MongoDB:

```bash
npm run fetch-all
```

This will:
1. Fetch all projects from the LFX Mentorship API
2. Transform and filter them (2021 onward)
3. Group them into organizations
4. Upsert everything into MongoDB with proper indexes

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Data Pipeline

The data pipeline (`scripts/fetch-all.mjs`) runs in 6 steps:

1. **Fetch** - Paginated retrieval from `api.mentorship.lfx.linuxfoundation.org`
2. **Transform** - Filters to 2021+, normalizes fields, maps to foundations
3. **Group** - Aggregates projects into organization records with stats
4. **Build Meta** - Generates aggregate metadata (foundations list, year range, skill tags)
5. **Upsert to MongoDB** - Idempotent bulk writes (no duplicates)
6. **Create Indexes** - Ensures `slug` and `orgSlug` indexes exist

A GitHub Actions workflow runs this every Monday at 6 AM UTC, commits any data changes, and pushes automatically.

---

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


---

## License

This is an open-source community project. All data is sourced from the publicly available LFX Mentorship API.

---

## Acknowledgements

- [LFX Mentorship](https://mentorship.lfx.linuxfoundation.org) by the Linux Foundation
- [gsocorganizations.dev](https://www.gsocorganizations.dev/) for the inspiration
- All the open-source organizations and mentors making mentorship possible
