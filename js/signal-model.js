// Pure geometry and search functions shared by the interactive views.
export function createSignalPoints(seed = 1) {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  return Array.from({ length: 216 }, (_, i) => {
    const azimuth = random() * Math.PI * 2;
    const z = random() * 2 - 1;
    const radius = .3 + random() * .8;
    const ring = Math.sqrt(1 - z * z);
    const longitude = (i % 24) / 24 * Math.PI * 2;
    const tubeAngle = Math.floor(i / 24) / 9 * Math.PI * 2;
    const tubeRadius = .27;
    const ringRadius = .77 + Math.cos(tubeAngle) * tubeRadius;
    return {
      scatter: [Math.cos(azimuth) * ring * radius, z * radius, Math.sin(azimuth) * ring * radius],
      grid: [(i % 6 - 2.5) * .3, (Math.floor(i / 6) % 6 - 2.5) * .3, (Math.floor(i / 36) - 2.5) * .3],
      orbit: [Math.cos(longitude) * ringRadius, Math.sin(tubeAngle) * tubeRadius, Math.sin(longitude) * ringRadius],
      phase: random() * Math.PI * 2,
    };
  });
}

export function signalTarget(point, mode, dispersion) {
  const amount = Math.max(0, Math.min(100, Number(dispersion) || 0)) / 100;
  const target = point[mode] || point.scatter;
  const scale = .65 + amount * .65;
  return target.map((value, axis) => value * scale + (mode === "scatter" ? 0 : point.scatter[axis] * amount * .14));
}

export function filterProjects(projects, type = "all", query = "") {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return projects.filter(project => {
    const text = [project.name, project.repo, project.tagline, project.description, ...project.tags].join(" ").toLocaleLowerCase();
    return (type === "all" || project.type.includes(type)) && words.every(word => text.includes(word));
  });
}
