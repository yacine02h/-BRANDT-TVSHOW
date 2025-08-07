// Movie App JavaScript

class MovieApp {
    constructor() {
        // TMDB API Configuration
        this.API_KEY = '137daed5d3821dcd04356dfbd4173c34'; // يجب الحصول على مفتاح API من TMDB
        this.BASE_URL = 'https://api.themoviedb.org/3';
        this.IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';
        this.BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';
        
        // App State
        this.currentCategory = 'popular';
        this.currentPage = 1;
        this.currentSearchQuery = '';
        this.isLoading = false;
        this.movies = [];
        
        // DOM Elements
        this.moviesGrid = document.getElementById('moviesGrid');
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        this.loading = document.getElementById('loading');
        this.modal = document.getElementById('movieModal');
        this.movieDetails = document.getElementById('movieDetails');
        this.navBtns = document.querySelectorAll('.nav-btn');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadMovies();
    }
    
    setupEventListeners() {
        // Search functionality
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
        
        // Category navigation
        this.navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleCategoryChange(e.target.dataset.category);
            });
        });
        
        // Load more button
        this.loadMoreBtn.addEventListener('click', () => this.loadMoreMovies());
        
        // Modal functionality
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }
    
    async loadMovies(reset = true) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            let url;
            if (this.currentSearchQuery) {
                url = `${this.BASE_URL}/search/movie?api_key=${this.API_KEY}&query=${encodeURIComponent(this.currentSearchQuery)}&page=${this.currentPage}&language=ar`;
            } else {
                url = `${this.BASE_URL}/movie/${this.currentCategory}?api_key=${this.API_KEY}&page=${this.currentPage}&language=ar`;
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (reset) {
                this.movies = data.results;
                this.moviesGrid.innerHTML = '';
            } else {
                this.movies = [...this.movies, ...data.results];
            }
            
            this.renderMovies(data.results);
            this.updateLoadMoreButton(data.page < data.total_pages);
            
        } catch (error) {
            console.error('Error loading movies:', error);
            this.showError('حدث خطأ في تحميل الأفلام');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    renderMovies(movies) {
        if (movies.length === 0 && this.currentPage === 1) {
            this.showNoResults();
            return;
        }
        
        movies.forEach(movie => {
            const movieCard = this.createMovieCard(movie);
            this.moviesGrid.appendChild(movieCard);
        });
    }
    
    createMovieCard(movie) {
        const card = document.createElement('div');
        card.className = 'movie-card fade-in';
        card.addEventListener('click', () => this.showMovieDetails(movie.id));
        
        const posterPath = movie.poster_path 
            ? `${this.IMG_BASE_URL}${movie.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=No+Image';
        
        const rating = movie.vote_average;
        const ratingClass = rating >= 7 ? 'rating-good' : rating >= 5 ? 'rating-average' : 'rating-bad';
        
        card.innerHTML = `
            <img src="${posterPath}" alt="${movie.title}" class="movie-poster" loading="lazy">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <p class="movie-overview">${movie.overview || 'لا يوجد وصف متاح'}</p>
                <div class="movie-meta">
                    <div class="movie-rating ${ratingClass}">
                        <i class="fas fa-star"></i>
                        ${rating.toFixed(1)}
                    </div>
                    <div class="movie-date">${this.formatDate(movie.release_date)}</div>
                </div>
            </div>
        `;
        
        return card;
    }
    
    async showMovieDetails(movieId) {
        try {
            this.showLoading();
            
            // Fetch movie details
            const movieResponse = await fetch(`${this.BASE_URL}/movie/${movieId}?api_key=${this.API_KEY}&language=ar`);
            const movie = await movieResponse.json();
            
            // Fetch movie credits
            const creditsResponse = await fetch(`${this.BASE_URL}/movie/${movieId}/credits?api_key=${this.API_KEY}`);
            const credits = await creditsResponse.json();
            
            this.renderMovieDetails(movie, credits);
            this.modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
        } catch (error) {
            console.error('Error loading movie details:', error);
            this.showError('حدث خطأ في تحميل تفاصيل الفيلم');
        } finally {
            this.hideLoading();
        }
    }
    
    renderMovieDetails(movie, credits) {
        const backdropPath = movie.backdrop_path 
            ? `${this.BACKDROP_BASE_URL}${movie.backdrop_path}` 
            : `${this.IMG_BASE_URL}${movie.poster_path}`;
        
        const posterPath = movie.poster_path 
            ? `${this.IMG_BASE_URL}${movie.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=No+Image';
        
        const director = credits.crew.find(person => person.job === 'Director');
        const cast = credits.cast.slice(0, 5);
        
        this.movieDetails.innerHTML = `
            <img src="${backdropPath}" alt="${movie.title}" class="movie-backdrop">
            <div class="movie-details-content">
                <div class="movie-details-header">
                    <img src="${posterPath}" alt="${movie.title}" class="movie-details-poster">
                    <div class="movie-details-info">
                        <h2>${movie.title}</h2>
                        <div class="movie-details-meta">
                            <span class="meta-item">
                                <i class="fas fa-star"></i>
                                ${movie.vote_average.toFixed(1)}/10
                            </span>
                            <span class="meta-item">
                                <i class="fas fa-clock"></i>
                                ${movie.runtime} دقيقة
                            </span>
                            <span class="meta-item">
                                <i class="fas fa-calendar"></i>
                                ${this.formatDate(movie.release_date)}
                            </span>
                            ${director ? `<span class="meta-item">
                                <i class="fas fa-user"></i>
                                إخراج: ${director.name}
                            </span>` : ''}
                        </div>
                        <div class="movie-genres">
                            ${movie.genres.map(genre => `<span class="genre-tag">${genre.name}</span>`).join('')}
                        </div>
                        ${cast.length > 0 ? `
                            <div class="movie-cast">
                                <h4>طاقم التمثيل:</h4>
                                <p>${cast.map(actor => actor.name).join(', ')}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="movie-details-overview">
                    <h3>القصة:</h3>
                    <p>${movie.overview || 'لا يوجد وصف متاح'}</p>
                </div>
            </div>
        `;
    }
    
    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    handleSearch() {
        const query = this.searchInput.value.trim();
        if (query === this.currentSearchQuery) return;
        
        this.currentSearchQuery = query;
        this.currentPage = 1;
        this.loadMovies(true);
        
        // Update active nav button
        this.navBtns.forEach(btn => btn.classList.remove('active'));
    }
    
    handleCategoryChange(category) {
        if (category === this.currentCategory && !this.currentSearchQuery) return;
        
        this.currentCategory = category;
        this.currentSearchQuery = '';
        this.currentPage = 1;
        this.searchInput.value = '';
        
        // Update active nav button
        this.navBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        this.loadMovies(true);
    }
    
    loadMoreMovies() {
        this.currentPage++;
        this.loadMovies(false);
    }
    
    showLoading() {
        this.loading.classList.remove('hidden');
    }
    
    hideLoading() {
        this.loading.classList.add('hidden');
    }
    
    updateLoadMoreButton(hasMore) {
        this.loadMoreBtn.style.display = hasMore ? 'block' : 'none';
        this.loadMoreBtn.disabled = this.isLoading;
    }
    
    showNoResults() {
        this.moviesGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>لا توجد نتائج</h3>
                <p>لم نتمكن من العثور على أفلام تطابق بحثك</p>
            </div>
        `;
        this.updateLoadMoreButton(false);
    }
    
    showError(message) {
        this.moviesGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>حدث خطأ</h3>
                <p>${message}</p>
            </div>
        `;
        this.updateLoadMoreButton(false);
    }
    
    formatDate(dateString) {
        if (!dateString) return 'غير محدد';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if API key is set
    const app = new MovieApp();
    
    // Show warning if API key is not set
    if (app.API_KEY === 'YOUR_API_KEY_HERE') {
        alert('يرجى الحصول على مفتاح API من TMDB وإضافته في ملف script.js');
        console.warn('TMDB API Key is required. Get one from https://www.themoviedb.org/settings/api');
    }
});

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}