/**
 * Primer Technologies - About Page JavaScript
 * Handles team data loading, statistics animation, and page-specific functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Load team data from JSON
    loadTeamData();
    
    // Animate statistics
    animateStatistics();
    
    // Initialize any about page specific functionality
    initAboutPage();
});

/**
 * Load team data from team.json and display in grid
 */
async function loadTeamData() {
    try {
        const response = await fetch('data/team.json');
        const data = await response.json();
        displayTeam(data.team);
    } catch (error) {
        console.error('Error loading team data:', error);
        displayTeamError();
    }
}

/**
 * Display team members in the grid
 */
function displayTeam(teamMembers) {
    const teamGrid = document.getElementById('teamGrid');
    if (!teamGrid) return;
    
    teamGrid.innerHTML = '';
    
    teamMembers.forEach(member => {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        
        teamCard.innerHTML = `
            <div class="team-image">
                <img src="images/team/${member.image}" alt="${member.name}" loading="lazy">
                <div class="team-social">
                    <a href="#" aria-label="${member.name} LinkedIn"><i class="fab fa-linkedin-in"></i></a>
                    <a href="#" aria-label="${member.name} Twitter"><i class="fab fa-twitter"></i></a>
                    <a href="#" aria-label="${member.name} Email"><i class="fas fa-envelope"></i></a>
                </div>
            </div>
            <div class="team-content">
                <h3>${member.name}</h3>
                <p class="team-position">${member.position}</p>
                <p class="team-department">${member.department}</p>
                <p class="team-bio">${member.bio}</p>
            </div>
        `;
        
        teamGrid.appendChild(teamCard);
    });
}

/**
 * Display error message if team data fails to load
 */
function displayTeamError() {
    const teamGrid = document.getElementById('teamGrid');
    if (!teamGrid) return;
    
    teamGrid.innerHTML = `
        <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: var(--spacing-2xl);">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error); margin-bottom: var(--spacing-md);"></i>
            <h3>Unable to Load Team Information</h3>
            <p>Please check your connection and try again.</p>
            <button onclick="loadTeamData()" class="btn btn-primary" style="margin-top: var(--spacing-md);">
                <i class="fas fa-redo" style="margin-right: 0.5rem;"></i>Retry
            </button>
        </div>
    `;
}

/**
 * Animate statistics counter
 */
function animateStatistics() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    // Intersection Observer for animation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumber = entry.target;
                const target = parseInt(statNumber.getAttribute('data-count'));
                animateCounter(statNumber, target);
                observer.unobserve(statNumber);
            }
        });
    }, { threshold: 0.5 });
    
    statNumbers.forEach(stat => observer.observe(stat));
}

/**
 * Animate counter from 0 to target value
 */
function animateCounter(element, target) {
    const duration = 2000; // 2 seconds
    const steps = 60; // 60 frames
    const stepValue = target / steps;
    let current = 0;
    const increment = target / (duration / (1000 / 60)); // 60fps
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            if (target >= 1000) {
                element.textContent = (target / 1000).toFixed(1) + 'K+';
            }
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, duration / steps);
}

/**
 * Initialize about page specific functionality
 */
function initAboutPage() {
    // Add CSS for about page specific styles
    const style = document.createElement('style');
    style.textContent = `
        .about-story {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--spacing-2xl);
            align-items: center;
        }
        
        @media (min-width: 768px) {
            .about-story {
                grid-template-columns: 1fr 1fr;
            }
        }
        
        .story-image img {
            width: 100%;
            height: auto;
            border-radius: var(--border-radius-lg);
            box-shadow: var(--shadow-lg);
        }
        
        .values-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: var(--spacing-xl);
            margin-top: var(--spacing-2xl);
        }
        
        .value-card {
            text-align: center;
            padding: var(--spacing-xl);
            background: var(--surface-white);
            border-radius: var(--border-radius-lg);
            box-shadow: var(--shadow-md);
            transition: transform var(--transition-normal) ease;
        }
        
        .value-card:hover {
            transform: translateY(-4px);
        }
        
        .value-icon {
            width: 4rem;
            height: 4rem;
            background: linear-gradient(135deg, var(--primary-blue), var(--secondary-green));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto var(--spacing-lg);
            color: white;
            font-size: 1.5rem;
        }
        
        .team-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: var(--spacing-xl);
        }
        
        .team-card {
            background: var(--surface-white);
            border-radius: var(--border-radius-lg);
            overflow: hidden;
            box-shadow: var(--shadow-md);
            transition: transform var(--transition-normal) ease;
        }
        
        .team-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-xl);
        }
        
        .team-image {
            position: relative;
            height: 250px;
            overflow: hidden;
        }
        
        .team-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform var(--transition-normal) ease;
        }
        
        .team-card:hover .team-image img {
            transform: scale(1.05);
        }
        
        .team-social {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0,0,0,0.8));
            padding: var(--spacing-lg);
            display: flex;
            justify-content: center;
            gap: var(--spacing-md);
            opacity: 0;
            transform: translateY(20px);
            transition: all var(--transition-normal) ease;
        }
        
        .team-card:hover .team-social {
            opacity: 1;
            transform: translateY(0);
        }
        
        .team-social a {
            width: 2.5rem;
            height: 2.5rem;
            background: var(--surface-white);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-primary);
            text-decoration: none;
            transition: all var(--transition-fast) ease;
        }
        
        .team-social a:hover {
            background: var(--primary-blue);
            color: white;
        }
        
        .team-content {
            padding: var(--spacing-xl);
        }
        
        .team-position {
            color: var(--primary-blue);
            font-weight: 600;
            margin-bottom: var(--spacing-xs);
        }
        
        .team-department {
            color: var(--text-tertiary);
            font-size: var(--font-size-sm);
            margin-bottom: var(--spacing-md);
        }
        
        .team-bio {
            font-size: var(--font-size-sm);
            line-height: var(--line-height-relaxed);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: var(--spacing-xl);
            margin-top: var(--spacing-2xl);
        }
        
        .stat-card {
            text-align: center;
            padding: var(--spacing-lg);
        }
        
        .stat-number {
            font-size: var(--font-size-4xl);
            font-weight: 800;
            color: var(--primary-blue);
            margin-bottom: var(--spacing-sm);
        }
        
        .stat-label {
            color: var(--text-secondary);
            font-size: var(--font-size-sm);
        }
        
        .offices-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--spacing-xl);
            margin-top: var(--spacing-2xl);
        }
        
        @media (min-width: 768px) {
            .offices-grid {
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            }
        }
        
        .office-card {
            background: var(--surface-white);
            border-radius: var(--border-radius-lg);
            overflow: hidden;
            box-shadow: var(--shadow-md);
        }
        
        .office-image {
            height: 200px;
            overflow: hidden;
        }
        
        .office-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .office-content {
            padding: var(--spacing-xl);
        }
        
        .office-content address p {
            margin-bottom: var(--spacing-sm);
            display: flex;
            align-items: flex-start;
            gap: var(--spacing-sm);
        }
        
        .office-content i {
            color: var(--primary-blue);
            min-width: 1rem;
        }
        
        .cta-section {
            text-align: center;
            padding: var(--spacing-3xl) var(--spacing-xl);
            max-width: 800px;
            margin: 0 auto;
        }
        
        .cta-section h2 {
            margin-bottom: var(--spacing-lg);
        }
        
        .cta-section p {
            margin-bottom: var(--spacing-2xl);
            color: var(--text-secondary);
        }
        
        .cta-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-md);
            justify-content: center;
        }
        
        .error-message {
            text-align: center;
            padding: var(--spacing-2xl);
            background: var(--surface-white);
            border-radius: var(--border-radius-lg);
            box-shadow: var(--shadow-md);
        }
    `;
    
    document.head.appendChild(style);
}