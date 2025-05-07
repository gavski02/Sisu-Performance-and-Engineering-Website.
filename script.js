document.addEventListener('DOMContentLoaded', () => {

    // --- Global Elements ---
    const header = document.querySelector(".header-container");
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav"); // Renamed from 'nav' for clarity

    // --- Hamburger Menu Toggle ---
    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("active");
            hamburger.setAttribute("aria-expanded", navMenu.classList.contains("active"));
        });
        // Close menu when a link is clicked
        navMenu.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                if (navMenu.classList.contains("active")) {
                    hamburger.classList.remove("active");
                    navMenu.classList.remove("active");
                    hamburger.setAttribute("aria-expanded", "false");
                }
            });
        });
        // Close menu if clicking outside of it
        document.addEventListener('click', (event) => {
            if (!navMenu.contains(event.target) && !hamburger.contains(event.target) && navMenu.classList.contains('active')) {
                hamburger.classList.remove("active");
                navMenu.classList.remove("active");
                hamburger.setAttribute("aria-expanded", "false");
            }
        });
    }

    // --- Header Style Change on Scroll ---
    if (header) {
        const scrollThreshold = 10;
        const handleScroll = () => {
            if (window.scrollY > scrollThreshold) {
                header.classList.add("header-scrolled");
            } else {
                header.classList.remove("header-scrolled");
            }
        };
        // Debounce scroll handler for performance
        let scrollTimeout;
        window.addEventListener("scroll", () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(handleScroll, 50); // Adjust delay as needed
        });
        handleScroll(); // Initial check
    }

    // --- Scroll Fade-In Animations ---
    const fadeElements = document.querySelectorAll('.scroll-fade-in');
    if ('IntersectionObserver' in window && fadeElements.length > 0) {
         const observerOptions={root:null, rootMargin:'0px', threshold:0.1};
         const observerCallback=(entries, observer)=>{
             entries.forEach(entry=>{
                 if(entry.isIntersecting){
                     entry.target.classList.add('visible');
                     observer.unobserve(entry.target); // Stop observing once visible
                 }
             });
         };
         const observer = new IntersectionObserver(observerCallback, observerOptions);
         fadeElements.forEach(el => observer.observe(el));
    } else if (fadeElements.length > 0) {
        // Fallback for browsers without IntersectionObserver
        fadeElements.forEach(el => el.classList.add('visible'));
        console.warn("IntersectionObserver not supported, showing all fade elements immediately.");
    }


    // --- Page Specific Logic ---

    // --- Products Page ---
    const productsPageContainer = document.querySelector('.products-page-layout'); // Check for a specific container
    if (productsPageContainer) {
        const productGrid = document.getElementById("product-grid");
        const categoryFilterOptionsContainer = document.getElementById("category-filter-options");
        const availabilityCheckboxes = document.querySelectorAll('input[name="availability"]');
        const minPriceInput = document.getElementById('min-price');
        const maxPriceInput = document.getElementById('max-price');
        const sortSelect = document.getElementById('sort-select');
        const countDisplay = document.getElementById("product-count-display");
        const activeFiltersContainer = document.getElementById('active-filters');
        const noProductsMessage = document.querySelector('.no-products-message'); // Get the message element

        if (productGrid) {
            const allProductCards = Array.from(productGrid.querySelectorAll('.product-card'));
            let allCategories = new Set();
            let activeFilters = {
                availability: [],
                categories: [],
                minPrice: null,
                maxPrice: null
            };

            // --- Debounce Function ---
            function debounce(func, wait) {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            };

            // --- 1. Populate Category Filters (Updated Version) ---
            function populateCategoryFilters() {
                if (!categoryFilterOptionsContainer) {
                    console.error("Category filter options container not found.");
                    return;
                }
                categoryFilterOptionsContainer.innerHTML = ''; // Clear first
                allCategories.clear(); // Clear categories set

                allProductCards.forEach(card => {
                    const category = card.dataset.category;
                    if (category) {
                        allCategories.add(category.trim());
                    }
                });

                if (allCategories.size > 0) {
                    const sortedCategories = Array.from(allCategories).sort();
                    sortedCategories.forEach(category => {
                        const label = document.createElement('label');
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.name = 'category';
                        checkbox.value = category;
                        checkbox.addEventListener('change', handleFilterChange); // Use defined handler

                        label.appendChild(checkbox);
                        label.appendChild(document.createTextNode(` ${category}`));
                        categoryFilterOptionsContainer.appendChild(label);
                    });
                } else {
                    categoryFilterOptionsContainer.innerHTML = '<p>No categories found.</p>';
                    console.log("No product categories found from data attributes.");
                }
            }


            // --- 2. Update Active Filters State ---
            function updateActiveFiltersState() {
                activeFilters.availability = Array.from(document.querySelectorAll('input[name="availability"]:checked')).map(cb => cb.value);
                activeFilters.categories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);
                activeFilters.minPrice = minPriceInput && minPriceInput.value ? parseFloat(minPriceInput.value) : null;
                activeFilters.maxPrice = maxPriceInput && maxPriceInput.value ? parseFloat(maxPriceInput.value) : null;

                // Basic price validation
                if (activeFilters.minPrice !== null && (isNaN(activeFilters.minPrice) || activeFilters.minPrice < 0)) activeFilters.minPrice = 0;
                if (activeFilters.maxPrice !== null && (isNaN(activeFilters.maxPrice) || activeFilters.maxPrice < 0)) activeFilters.maxPrice = 0;
                if (activeFilters.minPrice !== null && activeFilters.maxPrice !== null && activeFilters.minPrice > activeFilters.maxPrice) {
                     activeFilters.maxPrice = null; // Reset max if min > max
                }
            }

            // --- 3. Display Active Filters & Clear Options ---
            function displayActiveFilters() {
                if (!activeFiltersContainer) return;
                activeFiltersContainer.innerHTML = '';
                let filtersApplied = false;

                const createTag = (text, type, value) => {
                    filtersApplied = true;
                    const tag = document.createElement('span');
                    tag.className = 'active-filter-tag';
                    tag.textContent = text;
                    const removeBtn = document.createElement('button');
                    removeBtn.innerHTML = '&times;';
                    removeBtn.setAttribute('aria-label', `Remove filter: ${text}`);
                    removeBtn.onclick = (e) => {
                        e.preventDefault();
                        removeFilter(type, value);
                    };
                    tag.appendChild(removeBtn);
                    activeFiltersContainer.appendChild(tag);
                };

                activeFilters.availability.forEach(val => createTag(`Status: ${val}`, 'availability', val));
                activeFilters.categories.forEach(val => createTag(`${val}`, 'category', val));

                 let priceText = '';
                 if (activeFilters.minPrice !== null && activeFilters.maxPrice !== null) {
                     priceText = `$${activeFilters.minPrice} - $${activeFilters.maxPrice}`;
                 } else if (activeFilters.minPrice !== null) {
                     priceText = `$${activeFilters.minPrice}+`;
                 } else if (activeFilters.maxPrice !== null) {
                     priceText = `Up to $${activeFilters.maxPrice}`;
                 }
                 if (priceText) createTag(priceText, 'price', null);

                if (filtersApplied) {
                    const clearBtn = document.createElement('button');
                    clearBtn.textContent = 'Clear All';
                    clearBtn.className = 'clear-all-btn';
                    clearBtn.onclick = (e) => {
                         e.preventDefault();
                         clearAllFilters();
                     };
                    activeFiltersContainer.appendChild(clearBtn);
                }
            }

            // --- 4. Remove Single Filter ---
            function removeFilter(type, value) {
                if (type === 'availability' || type === 'category') {
                    const checkbox = document.querySelector(`input[name="${type}"][value="${value}"]`);
                    if (checkbox) checkbox.checked = false;
                } else if (type === 'price') {
                    if (minPriceInput) minPriceInput.value = '';
                    if (maxPriceInput) maxPriceInput.value = '';
                }
                applyFiltersAndSort();
            }

            // --- 5. Clear All Filters ---
            function clearAllFilters() {
                 document.querySelectorAll('input[name="availability"]:checked').forEach(cb => cb.checked = false);
                 document.querySelectorAll('input[name="category"]:checked').forEach(cb => cb.checked = false);
                 if (minPriceInput) minPriceInput.value = '';
                 if (maxPriceInput) maxPriceInput.value = '';
                 if (sortSelect) sortSelect.value = 'default';
                 applyFiltersAndSort();
            }

            // --- 6. Main Filtering and Sorting Logic ---
            const applyFiltersAndSort = () => {
                updateActiveFiltersState();

                let visibleProductNodes = [];

                allProductCards.forEach(card => {
                    const price = parseFloat(card.dataset.price) || 0;
                    const category = card.dataset.category || '';
                    const availability = card.dataset.availability || '';
                    let show = true;

                    // Availability Filter
                    if (activeFilters.availability.length > 0 && !activeFilters.availability.includes(availability)) {
                        show = false;
                    }
                    // Category Filter
                    if (show && activeFilters.categories.length > 0 && !activeFilters.categories.includes(category)) {
                        show = false;
                    }
                     // Price Filter
                     if (show) {
                         const minMatch = activeFilters.minPrice === null || price >= activeFilters.minPrice;
                         const maxMatch = activeFilters.maxPrice === null || price <= activeFilters.maxPrice;
                         if (!(minMatch && maxMatch)) {
                             show = false;
                         }
                     }

                     // Add to visible list or hide
                     if (show) {
                         visibleProductNodes.push(card);
                     }
                     card.style.display = 'none'; // Hide all initially, visible ones re-added later
                });

                // --- Sorting Logic ---
                 const getProductData = (cardElement) => {
                     const nameElement = cardElement.querySelector('h3');
                     const name = nameElement ? nameElement.textContent.trim().toLowerCase() : '';
                     const price = parseFloat(cardElement.dataset.price) || 0;
                     return { element: cardElement, name, price };
                 };

                const sortedVisibleProductsData = visibleProductNodes.map(getProductData);
                const sortBy = sortSelect ? sortSelect.value : 'default';

                 sortedVisibleProductsData.sort((a, b) => {
                     switch (sortBy) {
                         case 'price-asc': return a.price - b.price;
                         case 'price-desc': return b.price - a.price;
                         case 'alpha-asc': return a.name.localeCompare(b.name);
                         case 'alpha-desc': return b.name.localeCompare(a.name);
                         default: return 0; // Maintain original order relative to each other
                     }
                 });

                // --- Re-append sorted nodes ---
                 productGrid.innerHTML = ''; // Clear grid before re-appending
                 // Ensure the 'no products' message exists or create it if needed
                 let currentNoProductsMessage = productGrid.querySelector('.no-products-message');
                 if (!currentNoProductsMessage && noProductsMessage) {
                     // If original exists but isn't in grid, use it
                     currentNoProductsMessage = noProductsMessage;
                 } else if (!currentNoProductsMessage) {
                    // If it doesn't exist at all, create it
                    currentNoProductsMessage = document.createElement('div');
                    currentNoProductsMessage.className = 'no-products-message';
                    currentNoProductsMessage.textContent = 'No products match your filters.';
                    currentNoProductsMessage.style.display = 'none'; // Hide initially
                 }
                 // Always append the message div to ensure it's present
                 productGrid.appendChild(currentNoProductsMessage);


                 if (sortedVisibleProductsData.length > 0) {
                    sortedVisibleProductsData.forEach(productData => {
                        productData.element.style.display = ''; // Make visible
                        productGrid.appendChild(productData.element); // Re-append/reorder
                    });
                    currentNoProductsMessage.style.display = 'none'; // Hide 'no products' message
                 } else {
                    currentNoProductsMessage.style.display = 'block'; // Show 'no products' message
                 }

                // --- Update UI ---
                updateProductCount(sortedVisibleProductsData.length);
                displayActiveFilters();
            };


            // --- 7. Update Product Count ---
            function updateProductCount(count) {
                if (countDisplay) {
                     countDisplay.textContent = `${count} ${count === 1 ? 'product' : 'products'}`;
                 }
            }

            // --- 8. Event Listeners Setup ---
            // Define handleFilterChange used in populateCategoryFilters
             const handleFilterChange = () => {
                 applyFiltersAndSort();
             }

            const debouncedPriceChange = debounce(applyFiltersAndSort, 400);

            availabilityCheckboxes.forEach(cb => cb.addEventListener('change', handleFilterChange));
            // Category listeners added dynamically in populateCategoryFilters

            if (minPriceInput) minPriceInput.addEventListener('input', debouncedPriceChange);
            if (maxPriceInput) maxPriceInput.addEventListener('input', debouncedPriceChange);
            if (sortSelect) sortSelect.addEventListener('change', applyFiltersAndSort);

            // --- Initial Setup ---
            populateCategoryFilters(); // Create category checkboxes
            applyFiltersAndSort(); // Apply initial state (which might be no filters)


        } // End of productGrid check
    } // End of products page check


    // --- Contact Form Page ---
    // *** FIXED SELECTOR ***
    // Select the actual <form> element, which is a descendant of the section with class 'contact-us-form'
    const contactForm = document.querySelector('.contact-us-form form');

    if (contactForm) {
         const firstName = document.getElementById('first-name');
         const lastName = document.getElementById('last-name');
         const email = document.getElementById('email');
         const message = document.getElementById('message');
         // Find status message relative to the form itself now
         const formStatusMessage = contactForm.closest('.contact-us-form')?.querySelector('.form-status-message');

         // Function to show error
         const showError = (input, messageText) => {
            if (!input) return; // Safety check
            input.classList.add('invalid-input');
            input.setAttribute('aria-invalid', 'true');
            let errorElement = input.closest('.form-group')?.querySelector('.error-message');
            let nameRow = input.closest('.form-input-row');
             let rowErrorSpan = nameRow ? nameRow.nextElementSibling : null;

            if (errorElement && errorElement.classList.contains('error-message')) {
                 errorElement.textContent = messageText;
                 errorElement.style.display = 'block';
                 errorElement.setAttribute('role', 'alert');
            } else if (nameRow && rowErrorSpan && rowErrorSpan.classList.contains('error-message')) {
                 // Handle combined row error message
                 nameRow.classList.add('invalid-row');
                 rowErrorSpan.textContent = 'Please fill out both first and last name.'; // Specific message
                 rowErrorSpan.style.visibility = 'visible';
                 rowErrorSpan.setAttribute('role', 'alert');
             }
         };

         // Function to hide error
         const hideError = (input) => {
            if (!input) return; // Safety check
            input.classList.remove('invalid-input');
            input.removeAttribute('aria-invalid');
            let errorElement = input.closest('.form-group')?.querySelector('.error-message');
            let nameRow = input.closest('.form-input-row');
             let rowErrorSpan = nameRow ? nameRow.nextElementSibling : null;

            if (errorElement && errorElement.classList.contains('error-message')) {
                 errorElement.textContent = '';
                 errorElement.style.display = 'none';
                 errorElement.removeAttribute('role');
            }

             // Check if row is now valid and hide row error
             if (nameRow && firstName?.checkValidity() && lastName?.checkValidity()) {
                 nameRow.classList.remove('invalid-row');
                 if (rowErrorSpan && rowErrorSpan.classList.contains('error-message')) {
                    rowErrorSpan.textContent = '';
                    rowErrorSpan.style.visibility = 'hidden';
                    rowErrorSpan.removeAttribute('role');
                 }
             }
         };

         // Validation function
         const validateInput = (input) => {
             if (!input) return true; // Skip validation if input doesn't exist
             if (!input.checkValidity()) {
                 let messageText = input.validationMessage;
                 if (input.validity.valueMissing) {
                     // More specific required messages
                     if (input.id === 'first-name' || input.id === 'last-name') {
                         messageText = `${input.placeholder.replace('*','')} is required.`;
                     } else {
                         messageText = `${input.getAttribute('placeholder')?.replace('*','') || 'This field'} is required.`;
                     }

                 } else if (input.type === 'email' && input.validity.typeMismatch) {
                     messageText = 'Please enter a valid email address.';
                 }
                 showError(input, messageText);
                 return false;
             } else {
                 hideError(input);
                 return true;
             }
         };

        const inputsToValidate = [firstName, lastName, email, message]; // Filter nulls implicitly via loop check

        // Validate on blur
        inputsToValidate.forEach(input => {
            if (input) { // Only add listener if input exists
                 input.addEventListener('blur', () => { validateInput(input) });
            }
        });

        // Validate on submit
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            let isFormValid = true;

             // Validate individual fields first
            inputsToValidate.forEach(input => {
                if (!validateInput(input)) {
                    isFormValid = false;
                }
            });

             // Special check for name row validity
             if (firstName && lastName && (!firstName.checkValidity() || !lastName.checkValidity())) {
                 let nameRow = firstName.closest('.form-input-row');
                 let rowErrorSpan = nameRow ? nameRow.nextElementSibling : null;
                 if (nameRow && rowErrorSpan && rowErrorSpan.classList.contains('error-message')) {
                     nameRow.classList.add('invalid-row');
                     rowErrorSpan.textContent = 'Please fill out both first and last name.';
                     rowErrorSpan.style.visibility = 'visible';
                     rowErrorSpan.setAttribute('role', 'alert');
                 }
                 isFormValid = false; // Ensure form is marked invalid
             }


             // Clear previous status messages
             if (formStatusMessage) {
                formStatusMessage.textContent = '';
                formStatusMessage.className = 'form-status-message';
                formStatusMessage.style.display = 'none';
             }

            if (!isFormValid) {
                // Focus the first invalid input or the first input in an invalid row
                const firstInvalid = contactForm.querySelector('.invalid-input, .invalid-row input');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            // --- Form Submission Logic ---
            const submitButton = contactForm.querySelector('button[type="submit"]');
            // *** This line should now work correctly ***
            const formData = new FormData(contactForm);
            const formAction = contactForm.action;

             if (!formAction || formAction.includes('YOUR_FORM_ENDPOINT_URL_HERE') || formAction.endsWith('/contact.html')) {
                 console.error('Form submission failed: Form action URL is not set correctly in contact.html.');
                 if (formStatusMessage) {
                    formStatusMessage.textContent = 'Form submission is not configured correctly. Please contact the site administrator.';
                    formStatusMessage.className = 'form-status-message error';
                    formStatusMessage.style.display = 'block';
                 }
                 return; // Stop submission if action URL is invalid
             }

            if(submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Submitting...';
            }


            try {
                const response = await fetch(formAction, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' } // Important for services expecting JSON response preference
                });

                // Check if response indicates success (status 2xx)
                if (response.ok) {
                    // Attempt to parse JSON, but handle cases where response might be empty or not JSON
                    let responseData = {};
                    try {
                        responseData = await response.json();
                    } catch (jsonError) {
                        console.log("Response was not JSON, but status was OK.", response.status, response.statusText);
                        // Assume success if status is OK, even without JSON
                    }

                    contactForm.reset();
                    inputsToValidate.forEach(hideError); // Clear validation styles
                    // Explicitly clear name row error styling
                    let nameRow = firstName ? firstName.closest('.form-input-row') : null;
                    if(nameRow) nameRow.classList.remove('invalid-row');
                    let rowErrorSpan = nameRow ? nameRow.nextElementSibling : null;
                     if(rowErrorSpan) {
                         rowErrorSpan.textContent = '';
                         rowErrorSpan.style.visibility = 'hidden';
                     }

                    if (formStatusMessage) {
                        // Use message from response if available, otherwise default
                        formStatusMessage.textContent = responseData.message || 'Thank you! Your message has been sent.';
                        formStatusMessage.className = 'form-status-message success';
                        formStatusMessage.style.display = 'block';
                    }
                    console.log('Form submitted successfully', responseData);

                } else {
                     // Handle non-OK responses (e.g., 4xx, 5xx)
                     let errorData = { message: `Submission failed with status: ${response.status}` };
                     try {
                         // Try to get more specific error message from response body
                         errorData = await response.json();
                     } catch (jsonError) {
                          console.log("Could not parse error response as JSON.", response.status, response.statusText);
                     }
                     console.error('Form submission failed:', response.status, response.statusText, errorData);
                     if (formStatusMessage) {
                        formStatusMessage.textContent = `Error: ${errorData.message || 'Could not send message. Please try again.'}`;
                        formStatusMessage.className = 'form-status-message error';
                        formStatusMessage.style.display = 'block';
                    }
                }
            } catch (error) {
                // Handle network errors (fetch couldn't complete)
                console.error('Form submission network error:', error);
                if (formStatusMessage) {
                    formStatusMessage.textContent = 'Network error. Please check connection and try again.';
                    formStatusMessage.className = 'form-status-message error';
                     formStatusMessage.style.display = 'block';
                }
            } finally {
                // Re-enable button regardless of outcome
                if(submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'SUBMIT';
                }
            }
        });
    } // End of contact form check


        // --- Footer Current Year ---
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

}); // End of DOMContentLoaded listener
