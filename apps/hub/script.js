fetch('/api/projects')
  .then(response => response.json())
  .then(({ projects }) => {
    console.log({ projects });
    const projectsList = document.getElementById('projects');
    projects.forEach(project => {
      const div = document.createElement('div');
      div.classList.add('project-card');

      const a = document.createElement('a');
      a.classList.add('project-link');

      const titleEl = document.createElement('h2');
      titleEl.classList.add('project-title');
      titleEl.textContent = project.name;

      const descriptionEl = document.createElement('p');
      descriptionEl.classList.add('project-description');
      descriptionEl.textContent = project.description;

      a.appendChild(titleEl);
      a.appendChild(descriptionEl);

      a.href = project.url;
      div.appendChild(a);
      projectsList.appendChild(div);
    });
  });
