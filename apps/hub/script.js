fetch('/api/projects')
  .then(response => response.json())
  .then(({ projects }) => {
    const projectsList = document.getElementById('projects-list');
    projects.forEach(project => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.textContent = project.name;
      a.href = `/${project.slug}`;
      li.appendChild(a);
      projectsList.appendChild(li);
    });
  });
