// Pure search shared by the project list.
export function filterProjects(projects, type = "all", query = "") {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return projects.filter(project => {
    const text = [project.name, project.repo, project.tagline, project.description, ...project.tags].join(" ").toLocaleLowerCase();
    return (type === "all" || project.type.includes(type)) && words.every(word => text.includes(word));
  });
}
