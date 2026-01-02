fetch('/api/projects')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(({ projects }) => {
    const projectsList = document.getElementById('projects');

    const accentColors = [
      'var(--color-accent-yellow)',
      'var(--color-accent-green)',
      'var(--color-accent-pink)',
      'var(--color-accent-purple)',
      'var(--color-accent-cyan)',
      'var(--color-accent-orange)',
    ];
    let lastColorIndex = -1;

    const getRandomColor = () => {
      let colorIndex;
      do {
        colorIndex = Math.floor(Math.random() * accentColors.length);
      } while (accentColors.length > 1 && colorIndex === lastColorIndex);
      lastColorIndex = colorIndex;
      return accentColors[colorIndex];
    };

    const getStyledProjects = () =>
      projects.map(project => ({
        ...project,
        color: getRandomColor(),
        rotation: (Math.random() - 0.5) * 1.2,
      }));

    const createProjectCards = projectsArray => {
      const fragment = document.createDocumentFragment();
      projectsArray.forEach(project => {
        const div = document.createElement('div');
        div.classList.add('project-card');

        div.style.backgroundColor = project.color;
        div.style.boxShadow = '10px 10px 0 var(--color-bg-black)';
        div.style.transform = `rotate(${project.rotation}deg)`;

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
        fragment.appendChild(div);
      });
      return fragment;
    };

    const createMarqueeContent = () => {
      const marqueeContent = document.createElement('div');
      marqueeContent.classList.add('marquee-content');
      const projectCards = createProjectCards(getStyledProjects());
      marqueeContent.appendChild(projectCards);

      return marqueeContent;
    };

    const createMarquee = (reverse = false) => {
      const marqueeWrapper = document.createElement('div');
      marqueeWrapper.classList.add('marquee-wrapper');

      const marquee = document.createElement('div');
      marquee.classList.add('marquee');
      if (reverse) {
        marquee.classList.add('reverse');
      }

      marquee.appendChild(createMarqueeContent());
      marquee.appendChild(createMarqueeContent());
      marquee.appendChild(createMarqueeContent());

      marqueeWrapper.appendChild(marquee);
      return marqueeWrapper;
    };

    projectsList.appendChild(createMarquee());
    projectsList.appendChild(createMarquee(true));
  })
  .catch(error => {
    console.error('Failed to load projects:', error);
    const projectsList = document.getElementById('projects');
    if (projectsList) {
      projectsList.innerHTML =
        '<p style="text-align: center; padding: 2rem;">Failed to load projects. Please try again later.</p>';
    }
  });
