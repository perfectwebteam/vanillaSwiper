/*! vanillaSwiper | (c) 2017 Robin Poort | Perfect Web Team, https://perfectwebteam.nl/ */

(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define([], factory(root));
    } else if ( typeof exports === 'object' ) {
        module.exports = factory(root);
    } else {
        root.vanillaSwiper = factory(root);
    }
})(typeof global !== "undefined" ? global : this.window || this.global, function (root) {

    'use strict';

    // Variables
    var vanillaSwiper = {}; // Object for public APIs
    var supports = 'querySelector' in document && 'addEventListener' in root && 'classList' in document.createElement('_');; // Feature test
    var settings, eventTimeout;

    // Default settings
    var defaults = {
        selector: '[data-natural-scroll]',
        swiperContainerClass: 'swiper-container',
        swiperWrapperClass: 'swiper-wrapper',
        swiperPrevClass: 'swiper-prev',
        swiperNextClass: 'swiper-next',
        hiddenClass: 'is-hidden',
        animationSpeed: 300,
        spacing: 8,
        visiblePortion: 9,
        defaultMaxWidth: 320
    };

    /**
     * A simple forEach() implementation for Arrays, Objects and NodeLists.
     * @private
     * @author Todd Motto
     * @link   https://github.com/toddmotto/foreach
     * @param {Array|Object|NodeList} collection Collection of items to iterate
     * @param {Function}              callback   Callback function for each iteration
     * @param {Array|Object|NodeList} scope      Object/NodeList/Array that forEach is iterating over (aka `this`)
     */
    var forEach = function ( collection, callback, scope ) {
        if ( Object.prototype.toString.call( collection ) === '[object Object]' ) {
            for ( var prop in collection ) {
                if ( Object.prototype.hasOwnProperty.call( collection, prop ) ) {
                    callback.call( scope, collection[prop], prop, collection );
                }
            }
        } else {
            for ( var i = 0, len = collection.length; i < len; i++ ) {
                callback.call( scope, collection[i], i, collection );
            }
        }
    };

    /**
     * Merge two or more objects. Returns a new object.
     * @private
     * @param {Boolean}  deep     If true, do a deep (or recursive) merge [optional]
     * @param {Object}   objects  The objects to merge together
     * @returns {Object}          Merged values of defaults and options
     */
    var extend = function () {

        // Variables
        var extended = {};
        var deep = false;
        var i = 0;
        var length = arguments.length;

        // Check if a deep merge
        if ( Object.prototype.toString.call( arguments[0] ) === '[object Boolean]' ) {
            deep = arguments[0];
            i++;
        }

        // Merge the object into the extended object
        var merge = function (obj) {
            for ( var prop in obj ) {
                if ( Object.prototype.hasOwnProperty.call( obj, prop ) ) {
                    // If deep merge and property is an object, merge properties
                    if ( deep && Object.prototype.toString.call(obj[prop]) === '[object Object]' ) {
                        extended[prop] = extend( true, extended[prop], obj[prop] );
                    } else {
                        extended[prop] = obj[prop];
                    }
                }
            }
        };

        // Loop through each object and conduct a merge
        for ( ; i < length; i++ ) {
            var obj = arguments[i];
            merge(obj);
        }

        return extended;

    };

    /**
     * scrollStop.js | (c) 2017 Chris Ferdinandi | MIT License | http://github.com/cferdinandi/scrollStop
     * Run functions after scrolling has stopped
     * @param  {Function} callback The function to run after scrolling
     */
    var scrollStop = function($element, callback) {
        
        // Make sure a valid callback was provided
        if (!callback || Object.prototype.toString.call(callback) !== '[object Function]') return;
        
        // Setup scrolling variable
        var isScrolling;
        
        // Listen for scroll events
        $element.addEventListener('scroll', function(event) {
            
            // Clear our timeout throughout the scroll
            if (isScrolling !== null) {
                clearTimeout(isScrolling);
            }
            
            // Set a timeout to run after scrolling ends
            isScrolling = setTimeout(function() {
                // Run the callback
                callback();
            }, 66);
        }, false);
    };

    /**
     * Animation function
     */
    function animate(elem, style, unit, from, to, time, prop) {
        if (!elem) {
            return;
        }
        var start = new Date().getTime(),
            timer = setInterval(function () {
                var step = Math.min(1, (new Date().getTime() - start) / time);
                if (prop) {
                    elem[style] = (from + step * (to - from))+unit;
                } else {
                    elem.style[style] = (from + step * (to - from))+unit;
                }
                if (step === 1) {
                    clearInterval(timer);
                }
            }, 25);
        if (prop) {
            elem[style] = from+unit;
        } else {
            elem.style[style] = from+unit;
        }
    }

    /**
     * Add buttons to the wrapper
     */
    function addButtons($swipeWrapper) {
        var $prevButton = document.createElement('button'),
            $nextButton = document.createElement('button');

        $prevButton.classList.add(settings.swiperPrevClass);
        $prevButton.style.display = 'none';
        $nextButton.classList.add(settings.swiperNextClass);

        $swipeWrapper.parentNode.insertBefore($prevButton, $swipeWrapper);
        $swipeWrapper.parentNode.insertBefore($nextButton, $swipeWrapper.nextSibling);

        $prevButton.addEventListener('click', clickHandler, false);
        $nextButton.addEventListener('click', clickHandler, false);
    }

    /**
     * Hide buttons when scrolling is unavailable
     */
    function hideButtons($swipeWrapper) {
        var $prevButton = $swipeWrapper.querySelector('.' + settings.swiperPrevClass);
        var $nextButton = $swipeWrapper.querySelector('.' + settings.swiperNextClass);
        $prevButton.classList.add(settings.hiddenClass);
        $nextButton.classList.add(settings.hiddenClass);
        $prevButton.setAttribute('disabled', 'disabled');
        $nextButton.setAttribute('disabled', 'disabled');
    }

    /**
     * Display buttons when scrolling is available again
     */
    function showButtons($swipeWrapper) {
        var $prevButton = $swipeWrapper.querySelector('.' + settings.swiperPrevClass);
        var $nextButton = $swipeWrapper.querySelector('.' + settings.swiperNextClass);
        $prevButton.classList.remove(settings.hiddenClass);
        $nextButton.classList.remove(settings.hiddenClass);
        $prevButton.removeAttribute('disabled');
        $nextButton.removeAttribute('disabled');
    }

    /**
     * Remove buttons on destroy
     */
    function removeButtons($swipeWrapper) {
        var $prevButton = $swipeWrapper.querySelector('.' + settings.swiperPrevClass);
        var $nextButton = $swipeWrapper.querySelector('.' + settings.swiperNextClass);
        $prevButton.parentNode.removeChild($prevButton);
        $nextButton.parentNode.removeChild($nextButton);
    }

    /**
     * Initialize the swipers
     */
    function initialize(settings) {

        // Get all page swipers
        var swipers = document.querySelectorAll(settings.selector);

        // See if any exist and initialize when so
        if ( swipers && swipers.length ) {

            forEach(swipers, function($swiper) {

                var $swipeWrapper = document.createElement('div'),
                    $swipeContainer = document.createElement('div');

                $swipeWrapper.classList.add(settings.swiperWrapperClass);
                $swipeContainer.classList.add(settings.swiperContainerClass);

                $swiper.parentNode.insertBefore($swipeContainer, $swiper);
                $swipeContainer.appendChild($swiper);

                $swipeContainer.parentNode.insertBefore($swipeWrapper, $swipeContainer);
                $swipeWrapper.appendChild($swipeContainer);

                // Add scroll listener
                $swipeContainer.addEventListener('scroll', scrollHandler, false);

                // Add buttons
                addButtons($swipeContainer);

                // Set widths
                setWidths($swiper);

                // Calculate scroll
                calculateScroll();

            });
        }
    }

    /**
     * calculateAmounts
     * Calculate amounts of items to show / scroll
     */
    var calculateAmounts = function($swiper) {
        var containerWidth = $swiper.parentNode.offsetWidth;
        var itemMaxWidth = parseInt($swiper.getAttribute('data-scroll-maxwidth'), 10) || settings.defaultMaxWidth;
        var amountToScroll = Math.ceil((containerWidth * (settings.visiblePortion / 10)) / itemMaxWidth);
        return amountToScroll;
    };

    /**
     * setWidths
     * Set the width of the swiper element and it's children
     */
    function setWidths($swiper) {
        if ($swiper.parentNode.classList.contains(settings.swiperContainerClass)) {
            var items = $swiper.children,
                itemsAmount = items.length,
                itemsAmountToScroll = calculateAmounts($swiper),
                itemsToScroll = (settings.visiblePortion * 10) / itemsAmountToScroll,
                parentWidth = itemsAmount * itemsToScroll,
                itemsScrollWidth = 100 / itemsAmount,
                itemSpacing = $swiper.getAttribute('data-scroll-padding') || settings.spacing;

            // Set styling for individual items
            forEach(items, function($item) {
                $item.style.float = 'left';
                $item.style.width = itemsScrollWidth + '%';
                $item.style.paddingLeft = itemSpacing + 'px';
                $item.style.paddingRight = itemSpacing + 'px';
            });

            // Set styling for the parent
            $swiper.style.width = parentWidth + '%';
            $swiper.parentNode.style.marginLeft = -(itemSpacing) + 'px';
            $swiper.parentNode.style.marginRight = -(itemSpacing) + 'px';

            // Hide buttons when they're not needed anymore
            if ($swiper.parentNode.offsetWidth >= $swiper.offsetWidth ) {
                hideButtons($swiper.parentNode.parentNode);
            }
        }
    }

    /**
     * scrollTo
     */
    function scrollTo($button, direction) {
        var $swipeWrapper = $button.parentNode;
        var swipewrapperWidth = $swipeWrapper.offsetWidth;
        var $swipeContainer = $swipeWrapper.querySelector('.' + settings.swiperContainerClass);
        var currentscroll = $swipeContainer.scrollLeft;
        var $swipe = $swipeWrapper.querySelector('[data-natural-scroll]');
        var scrollAmount = calculateAmounts($swipe);
        var itemWidth = ($swipeWrapper.querySelector('.item').offsetWidth) * scrollAmount;
        var padding = (swipewrapperWidth - itemWidth) / 2;
        var currentAmount = Math.ceil(currentscroll / itemWidth) - 1;
        var negativeMargin = Math.abs(parseInt(window.getComputedStyle($swipeContainer).marginLeft, 10));
        if (direction == 'next') { currentAmount = Math.ceil(currentscroll / itemWidth) + 1; }
        var newPosition = (itemWidth * currentAmount) - (padding + (negativeMargin));
        animate($swipeContainer, "scrollLeft", "", currentscroll, newPosition, settings.animationSpeed, true);
    }

    /**
     * calculateScroll
     */
    var calculateScroll = function() {
        var documentElement = document.documentElement;
        var body = document.getElementsByTagName('body')[0];
        var windowWidth = window.innerWidth || documentElement.clientWidth || body.clientWidth;

        // Get all page swipers
        var swipers = document.querySelectorAll(settings.selector);

        // See if any exists and initialize when they do
        if ( swipers && swipers.length ) {

            forEach(swipers, function ($swiper) {
                var scrollUntil = parseInt($swiper.getAttribute('data-scroll-until'), 10) || 9999;

                if (windowWidth < scrollUntil) {
                    vanillaSwiper.enable($swiper);
                }
                else {
                    vanillaSwiper.disable($swiper);
                }

                calculateButtonVisibility($swiper.parentNode);
            });
        }
    };

    /**
     * Get current wrapper
     */

    function getWrapper($swiper) {
        var $swipeContainer = $swiper.parentNode;
        var $swipeWrapper = $swipeContainer.parentNode;
        return $swipeWrapper;
    }

    /**
     * Calculate button visibility
     */

    function calculateButtonVisibility($swipeContainer) {

        var $swipeWrapper = $swipeContainer.parentNode;
        var $prevButton = $swipeWrapper.querySelector('.' + settings.swiperPrevClass);
        var $nextButton = $swipeWrapper.querySelector('.' + settings.swiperNextClass);

        if ($swipeContainer.scrollLeft > 0) {
            $prevButton.style.display ='block';
        } else {
            $prevButton.style.display ='none';
        }
        if ($swipeContainer.scrollWidth - $swipeContainer.scrollLeft == $swipeContainer.offsetWidth) {
            $nextButton.style.display ='none';
        } else {
            $nextButton.style.display ='block';
        }
    }

    /**
     * If clicked
     * @private
     */
    var clickHandler = function () {
        var className = this.className;
        if ( className == settings.swiperPrevClass) {
            scrollTo(this, 'prev');
        }
        if ( className == settings.swiperNextClass) {
            scrollTo(this, 'next');
        }
    };

    /**
     * If scrolled
     * @private
     */
    var scrollHandler = function () {

        // Show or hide button?
        calculateButtonVisibility(this);

        scrollStop(this, function () {
            // scroll to correct position?
        });
    };

    /**
     * On window resize, only run events at a rate of 15fps for better performance
     * @private
     * @param  {Function} eventTimeout Timeout function
     * @param  {Object} settings
     */
    var resizeThrottler = function (event) {
        if ( !eventTimeout ) {
            eventTimeout = setTimeout(function() {
                eventTimeout = null; // Reset timeout
                calculateScroll();
            }, 66);
        }
    };

    /**
     * Disable the current initialization.
     * @public
     */
    vanillaSwiper.disable = function ($swiper) {

        // Hide the buttons
        hideButtons(getWrapper($swiper));

        // Reset styling
        var items = $swiper.children;
        forEach(items, function($item) {
            $item.removeAttribute('style');
        });

        $swiper.removeAttribute('style');
        $swiper.parentNode.removeAttribute('style');

    };

    /**
     * Enable the current initialization.
     * @public
     */
    vanillaSwiper.enable = function ($swiper) {

        // Hide the buttons
        showButtons(getWrapper($swiper));

        // Set widths
        setWidths($swiper);
    };

    /**
     * Destroy the current initialization.
     * @public
     */
    vanillaSwiper.destroy = function () {

        // If plugin isn't already initialized, stop
        if ( !settings ) return;

        // Remove event listeners
        root.removeEventListener( 'resize', resizeThrottler, false );

        // Remove the buttons
        removeButtons();

        // Reset varaibles
        settings = null;
    };

    /**
     * Initialize responsive toggle
     * @public
     * @param {Object} options User settings
     */
    vanillaSwiper.init = function ( options ) {

        // feature test
        if ( !supports ) return;

        // Destroy any existing initializations
        vanillaSwiper.destroy();

        // Selectors and variables
        settings = extend( defaults, options || {} ); // Merge user options with defaults

        // Initialize
        initialize(settings);

        // If window is resized and there's a fixed header, recalculate its size
        if ( vanillaSwiper ) {
            root.addEventListener( 'resize', resizeThrottler, false );
        }

    };


    //
    // Public APIs
    //

    return vanillaSwiper;

});
