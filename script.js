// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetSelector = this.getAttribute('href');
        if (!targetSelector || targetSelector === '#') return;
        const target = document.querySelector(targetSelector);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Navbar background change on scroll
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.8)';
    }
});

// Add animation to skills
const skills = document.querySelectorAll('.skills li');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, {
    threshold: 0.1
});

skills.forEach(skill => {
    skill.style.opacity = '0';
    skill.style.transform = 'translateY(20px)';
    skill.style.transition = 'all 0.5s ease';
    observer.observe(skill);
});

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        element.textContent = formatNumber(current) + ' SUBS';
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function initSubscriberCounts() {
    const subscriberElements = document.querySelectorAll('.subscriber-count');
    subscriberElements.forEach(element => {
        // Skip if this will be updated by the API
        if (element.hasAttribute('data-channel-id')) return;
        const text = element.textContent;
        const number = parseFloat(text);
        const unit = text.includes('M') ? 'M' : text.includes('K') ? 'K' : '';
        const finalValue = number * (unit === 'M' ? 1000000 : unit === 'K' ? 1000 : 1);
        element.textContent = '0 SUBS';
        element.classList.add('animate');
        setTimeout(() => {
            animateValue(element, 0, finalValue, 3000);
        }, 100);
    });
}

// YouTube API Configuration
const YOUTUBE_API_KEY = 'AIzaSyDTPfkdq61eG8sMPxC6gJkD39y6Xq4AJxw';
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

// Function to extract video ID from YouTube URL
function getVideoId(url) {
    // Handles youtu.be/VIDEOID and youtube.com/watch?v=VIDEOID and other formats
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

// Function to fetch video details from YouTube API
async function fetchVideoDetails(videoUrl) {
    const videoId = getVideoId(videoUrl);
    if (!videoId) return null;

    try {
        const response = await fetch(`${YOUTUBE_API_URL}/videos?part=snippet,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.items[0];
    } catch (error) {
        console.error('Error fetching video details:', error);
        return null;
    }
}

// Function to format view count
function formatViewCount(views) {
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M views';
    }
    if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K views';
    }
    return views + ' views';
}

// Function to update video titles
async function updateVideoTitles() {
    // Select all .work-item links
    const workItems = document.querySelectorAll('.work-item');
    for (const item of workItems) {
        const videoUrl = item.href;
        const placeholder = item.querySelector('.video-placeholder');
        if (!placeholder) continue;
        const titleElement = placeholder.querySelector('h3');
        const descriptionElement = placeholder.querySelector('p');
        // Set loading state
        titleElement.textContent = 'Loading...';
        descriptionElement.textContent = 'Loading...';
        const videoDetails = await fetchVideoDetails(videoUrl);
        if (videoDetails) {
            titleElement.textContent = videoDetails.snippet.title;
            const viewCount = formatViewCount(parseInt(videoDetails.statistics.viewCount));
            descriptionElement.textContent = `${videoDetails.snippet.channelTitle} • ${viewCount}`;
        } else {
            titleElement.textContent = 'Video Title Unavailable';
            descriptionElement.textContent = 'YouTube Video';
        }
    }
}

// Sort portfolio videos by highest view count
async function sortPortfolioVideosByViews() {
    const workGrid = document.querySelector('.work-grid');
    const workItems = Array.from(workGrid.querySelectorAll('.work-item'));
    // Fetch view counts for all videos
    const videoData = await Promise.all(workItems.map(async (item) => {
        const videoUrl = item.href;
        const details = await fetchVideoDetails(videoUrl);
        let viewCount = 0;
        if (details && details.statistics && details.statistics.viewCount) {
            viewCount = parseInt(details.statistics.viewCount, 10);
        }
        return { item, viewCount };
    }));
    // Sort by view count descending
    videoData.sort((a, b) => b.viewCount - a.viewCount);
    // Remove all current items
    workItems.forEach(item => workGrid.removeChild(item));
    // Re-append in sorted order
    videoData.forEach(({ item }) => workGrid.appendChild(item));
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize subscriber count animations
    initSubscriberCounts();
    
    // Update video titles
    updateVideoTitles().then(() => {
        sortPortfolioVideosByViews();
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetSelector = this.getAttribute('href');
            if (!targetSelector || targetSelector === '#') return;
            const target = document.querySelector(targetSelector);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Navbar background change on scroll
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Animate skills on scroll
    const skills = document.querySelectorAll('.skills li');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, { threshold: 0.5 });

    skills.forEach(skill => observer.observe(skill));

    const workItems = document.querySelectorAll('.work-item');
    
    // Function to get random delay between 0 and 0.8 seconds (even faster)
    const getRandomDelay = () => Math.random() * 800;
    
    // Set initial state
    workItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.7) translateY(40px)';
        item.style.transition = 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'; // bouncy easing
    });
    
    // Animate items with random delays
    workItems.forEach(item => {
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1) translateY(0)';
            
            // Add hover effect
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'scale(1.08) translateY(-8px)';
                item.style.transition = 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'scale(1) translateY(0)';
                item.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
            });
        }, getRandomDelay());
    });

    // Add click event to work items to only open in new tab and scroll, not update the portfolio player
    const portfolioSection = document.querySelector('.portfolio-video');
    workItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href) {
                e.preventDefault();
                // Scroll to portfolio section
                if (portfolioSection) {
                    portfolioSection.scrollIntoView({ behavior: 'smooth' });
                }
                // Open in new tab
                window.open(href, '_blank');
            }
        });
    });

    // Animate radial gradient background
    (function animateRadialGradient() {
        let angle = 0;
        setInterval(() => {
            angle += 0.008;
            const x = 50 + 30 * Math.cos(angle); // center x% (moves in a circle)
            const y = 50 + 30 * Math.sin(angle); // center y%
            document.body.style.background = `radial-gradient(ellipse at ${x}% ${y}%, #3b0a33 0%, #6e2a3a 60%, #ffd95a 100%)`;
        }, 30);
    })();
}); 