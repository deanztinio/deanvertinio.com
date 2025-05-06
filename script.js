// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
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
        element.textContent = formatNumber(current) + ' SUBSCRIBER';
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
        const text = element.textContent;
        const number = parseFloat(text);
        const unit = text.includes('M') ? 'M' : text.includes('K') ? 'K' : '';
        const finalValue = number * (unit === 'M' ? 1000000 : unit === 'K' ? 1000 : 1);
        
        // Reset the element
        element.textContent = '0 SUBSCRIBER';
        element.classList.add('animate');
        
        // Start animation after a small delay
        setTimeout(() => {
            animateValue(element, 0, finalValue, 3000);
        }, 100);
    });
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initSubscriberCounts);

// YouTube Data API configuration
const API_KEY = 'AIzaSyDTPfkdq61eG8sMPxC6gJkD39y6Xq4AJxw';
const API_URL = 'https://www.googleapis.com/youtube/v3/videos';

// Function to extract video ID from YouTube URL
function getVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Function to fetch video metadata with retry
async function fetchVideoMetadata(videoId, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Fetching metadata for video ID: ${videoId}`);
            const response = await fetch(`${API_URL}?part=snippet,statistics&id=${videoId}&key=${API_KEY}`);
            const data = await response.json();
            
            if (data.error) {
                console.error('API Error:', data.error);
                if (data.error.code === 403) {
                    throw new Error('API quota exceeded');
                }
                continue;
            }
            
            if (data.items && data.items.length > 0) {
                const video = data.items[0];
                console.log('Successfully fetched video metadata:', {
                    title: video.snippet.title,
                    viewCount: video.statistics.viewCount,
                    channelTitle: video.snippet.channelTitle
                });
                return {
                    title: video.snippet.title,
                    thumbnail: video.snippet.thumbnails.maxresdefault?.url || video.snippet.thumbnails.high?.url,
                    viewCount: parseInt(video.statistics.viewCount),
                    channelTitle: video.snippet.channelTitle
                };
            }
            console.log('No video data found for ID:', videoId);
            return null;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    return null;
}

// Function to fetch channel metadata
async function fetchChannelMetadata(channelId) {
    try {
        const response = await fetch(`${API_URL}?part=snippet,statistics&id=${channelId}&key=${API_KEY}`);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            const channel = data.items[0];
            return {
                title: channel.snippet.title,
                subscriberCount: parseInt(channel.statistics.subscriberCount),
                viewCount: parseInt(channel.statistics.viewCount)
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching channel metadata:', error);
        return null;
    }
}

// Function to update client items with metadata
async function updateClientItems() {
    const clientItems = document.querySelectorAll('.client-item');
    
    for (const item of clientItems) {
        try {
            const name = item.querySelector('.client-name');
            const count = item.querySelector('.subscriber-count');
            
            if (name && count) {
                // Get channel ID from the name
                const channelName = name.textContent.toLowerCase();
                const searchResponse = await fetch(
                    `${API_URL}?part=snippet&q=${channelName}&type=channel&maxResults=1&key=${API_KEY}`
                );
                const searchData = await searchResponse.json();
                
                if (searchData.items && searchData.items.length > 0) {
                    const channelId = searchData.items[0].id.channelId;
                    const metadata = await fetchChannelMetadata(channelId);
                    
                    if (metadata) {
                        // Update channel name
                        name.textContent = metadata.title;
                        
                        // Update subscriber count
                        const formattedSubs = formatNumber(metadata.subscriberCount);
                        count.textContent = `${formattedSubs} subscribers`;
                        count.classList.add('animate');
                    }
                }
            }
        } catch (error) {
            console.error('Error updating client item:', error);
        }
    }
}

// Function to update work items with metadata
async function updateWorkItems() {
    const workItems = document.querySelectorAll('.work-item');
    
    for (const item of workItems) {
        try {
            const link = item.querySelector('a');
            const videoId = getVideoId(link.href);
            
            if (videoId) {
                const metadata = await fetchVideoMetadata(videoId);
                if (metadata) {
                    // Update title with channel name and video title
                    const title = item.querySelector('h3');
                    if (title) {
                        const channelName = metadata.title;
                        const videoTitle = metadata.title;
                        title.textContent = `${channelName} - ${videoTitle}`;
                    }
                    
                    // Update description with view count
                    const description = item.querySelector('p');
                    if (description) {
                        const formattedViews = formatNumber(metadata.viewCount);
                        description.textContent = `${formattedViews} views`;
                    }
                    
                    // Update thumbnail if needed
                    const img = item.querySelector('img');
                    if (img && metadata.thumbnail) {
                        img.src = metadata.thumbnail;
                        img.alt = metadata.title;
                    }
                }
            }
        } catch (error) {
            console.error('Error updating work item:', error);
        }
    }
}

// Add tooltip styles
const style = document.createElement('style');
style.textContent = `
    .loading-state {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
    }
    
    .loading-spinner {
        width: 30px;
        height: 30px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    .error-state {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #e74c3c;
        font-size: 12px;
        text-align: center;
    }
    
    .view-count-tooltip {
        position: absolute;
        bottom: -25px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 1000;
    }
    
    .client-name {
        font-size: 11px;
        line-height: 1.2;
        margin-bottom: 4px;
    }
    
    .subscriber-count {
        font-size: 10px;
        color: var(--secondary-color);
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    updateClientItems();
    updateWorkItems();
}); 