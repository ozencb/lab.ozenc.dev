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

const shuffleArray = array => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const getStyledProjects = projects =>
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

const createMarquee = (projects, reverse = false) => {
  const marqueeWrapper = document.createElement('div');
  marqueeWrapper.classList.add('marquee-wrapper');

  const marquee = document.createElement('div');
  marquee.classList.add('marquee');
  if (reverse) {
    marquee.classList.add('reverse');
  }

  const marqueeContent = document.createElement('div');
  marqueeContent.classList.add('marquee-content');

  const styledProjects = getStyledProjects(projects);
  marqueeContent.appendChild(createProjectCards(styledProjects));

  let contentWidth = 0;
  let animationId;

  const calculateWidth = () => {
    const tempWrapper = document.createElement('div');
    tempWrapper.style.position = 'absolute';
    tempWrapper.style.left = '-9999px';
    const tempMarqueeContent = marqueeContent.cloneNode(true);
    tempWrapper.appendChild(tempMarqueeContent);
    document.body.appendChild(tempWrapper);
    contentWidth = tempMarqueeContent.offsetWidth;
    document.body.removeChild(tempWrapper);
  };

  calculateWidth();

  if (contentWidth === 0) {
    return {
      element: marqueeWrapper,
      stop: () => {},
    };
  }

  marquee.appendChild(marqueeContent);
  const cloneCount = Math.ceil(window.innerWidth / contentWidth) + 1;

  for (let i = 0; i < cloneCount; i++) {
    const clone = marqueeContent.cloneNode(true);
    marquee.appendChild(clone);
  }

  marqueeWrapper.appendChild(marquee);

  const animateMarquee = () => {
    let position;
    const speed = 0.5;

    function step() {
      if (reverse) {
        position -= speed;
        if (position <= -contentWidth) {
          position = 0;
        }
      } else {
        position += speed;
        if (position >= 0) {
          position = -contentWidth;
        }
      }

      marquee.style.transform = `translateX(${position}px)`;
      animationId = requestAnimationFrame(step);
    }

    if (reverse) {
      position = 0;
    } else {
      position = -contentWidth;
    }

    marquee.style.transform = `translateX(${position}px)`;
    animationId = requestAnimationFrame(step);

    marqueeWrapper.addEventListener('mouseenter', () => {
      cancelAnimationFrame(animationId);
    });

    marqueeWrapper.addEventListener('mouseleave', () => {
      animationId = requestAnimationFrame(step);
    });
  };

  animateMarquee();

  return {
    element: marqueeWrapper,
    stop: () => cancelAnimationFrame(animationId),
  };
};

let projectsData = [];
let stopFunctions = [];

const setupMarquees = projects => {
  stopFunctions.forEach(stop => stop());
  stopFunctions = [];

  const projectsList = document.getElementById('projects');
  if (!projectsList || !projects.length) return;

  while (projectsList.firstChild) {
    projectsList.removeChild(projectsList.firstChild);
  }

  const MARQUEE_ROW_HEIGHT = 320;
  const numMarquees = Math.max(
    1,
    Math.floor(projectsList.offsetHeight / MARQUEE_ROW_HEIGHT)
  );

  for (let i = 0; i < numMarquees; i++) {
    const isReverse = i % 2 !== 0;
    const shuffledProjects = shuffleArray([...projects]);
    const marquee = createMarquee(shuffledProjects, isReverse);

    projectsList.appendChild(marquee.element);
    stopFunctions.push(marquee.stop);
  }
};

const init = async () => {
  try {
    const response = await fetch('/api/projects');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const { projects } = await response.json();
    projectsData = projects;
    setupMarquees(projectsData);
  } catch (error) {
    console.error('Failed to load projects:', error);
    const projectsList = document.getElementById('projects');
    if (projectsList) {
      projectsList.innerHTML =
        '<p style="text-align: center; padding: 2rem;">Failed to load projects. Please try again later.</p>';
    }
  }
};

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => setupMarquees(projectsData), 250);
});

init();
