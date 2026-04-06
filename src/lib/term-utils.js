export function getSeason(month) {
  if (month >= 1 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  return 'fall';
}

export function getSeasonLabel(season) {
  return season.charAt(0).toUpperCase() + season.slice(1);
}

export function unixToTermRef(programTerm) {
  const startDate = new Date(programTerm.startDateTime * 1000);
  const endDate = new Date(programTerm.endDateTime * 1000);
  const year = startDate.getFullYear();
  const month = startDate.getMonth() + 1;
  const season = getSeason(month);

  const now = Date.now();
  let status = 'unknown';
  if (endDate.getTime() < now) {
    status = 'complete';
  } else if (startDate.getTime() <= now && endDate.getTime() >= now) {
    status = 'ongoing';
  } else if (programTerm.active === 'open') {
    status = 'accepting-applications';
  }

  return {
    id: programTerm.id,
    year,
    season,
    label: `${getSeasonLabel(season)} ${year}`,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status,
    menteeCount: programTerm.activeUsers || 0,
  };
}

export function compareTerms(a, b) {
  if (a.year !== b.year) return a.year - b.year;
  const order = { spring: 0, summer: 1, fall: 2 };
  return order[a.season] - order[b.season];
}
