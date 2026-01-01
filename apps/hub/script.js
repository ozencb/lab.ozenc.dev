fetch('/api/projects')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(({ projects }) => {
    const projectsList = document.getElementById('projects');

    const marqueeWrapper = document.createElement('div');
    marqueeWrapper.classList.add('marquee-wrapper');

    const marquee = document.createElement('div');
    marquee.classList.add('marquee');

    const createProjectCards = projectsArray => {
      const fragment = document.createDocumentFragment();
      projectsArray.forEach(project => {
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
        fragment.appendChild(div);
      });
      return fragment;
    };

    for (let i = 0; i < 3; i++) {
      marquee.appendChild(createProjectCards(projects));
    }

    marqueeWrapper.appendChild(marquee);
    projectsList.appendChild(marqueeWrapper);

    const initDragScroll = wrapper => {
      let isDown = false;
      let startX;
      let scrollLeft;
      let hasMoved = false;

      const handleDragStart = e => {
        isDown = true;
        startX = e.pageX - wrapper.offsetLeft;
        scrollLeft = wrapper.scrollLeft;
        hasMoved = false;
      };

      const handleDragEnd = () => {
        isDown = false;
        wrapper.classList.remove('is-dragging');
      };

      const handleDragMove = e => {
        if (!isDown) return;
        const x = e.pageX - wrapper.offsetLeft;
        const walk = (x - startX) * 2;

        if (Math.abs(walk) > 5) {
          hasMoved = true;
          wrapper.classList.add('is-dragging');
          e.preventDefault();
          wrapper.scrollLeft = scrollLeft - walk;
        }
      };

      const handleClick = e => {
        if (hasMoved) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      wrapper.addEventListener('mousedown', handleDragStart);
      wrapper.addEventListener('mouseleave', handleDragEnd);
      wrapper.addEventListener('mouseup', handleDragEnd);
      wrapper.addEventListener('mousemove', handleDragMove);
      wrapper.addEventListener('click', handleClick, true);
    };

    const initTouchScroll = wrapper => {
      let touchStartX = 0;
      let touchScrollLeft = 0;
      let hasTouchMoved = false;

      const handleTouchStart = e => {
        touchStartX = e.touches[0].pageX;
        touchScrollLeft = wrapper.scrollLeft;
        hasTouchMoved = false;
      };

      const handleTouchMove = e => {
        const x = e.touches[0].pageX;
        const walk = (touchStartX - x) * 1.5;

        if (Math.abs(walk) > 5) {
          hasTouchMoved = true;
        }

        wrapper.scrollLeft = touchScrollLeft + walk;
      };

      const handleTouchClick = e => {
        if (hasTouchMoved) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      wrapper.addEventListener('touchstart', handleTouchStart);
      wrapper.addEventListener('touchmove', handleTouchMove);
      wrapper.addEventListener('click', handleTouchClick, true);
    };

    initDragScroll(marqueeWrapper);
    initTouchScroll(marqueeWrapper);
  })
  .catch(error => {
    console.error('Failed to load projects:', error);
    const projectsList = document.getElementById('projects');
    if (projectsList) {
      projectsList.innerHTML =
        '<p style="text-align: center; padding: 2rem;">Failed to load projects. Please try again later.</p>';
    }
  });
