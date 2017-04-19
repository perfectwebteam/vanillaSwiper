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
    var supports = 'querySelector' in document && 'addEventListener' in root && 'classList' in document.createElement('_'); // Feature test
    var settings, eventTimeout;

    // Default settings
    var defaults = {
        selector: '[data-natural-swipe]',
        swiperContainerClass: 'swiper-container',
        swiperWrapperClass: 'swiper-wrapper',
        swiperPrevClass: 'swiper-prev',
        swiperNextClass: 'swiper-next',
        hiddenClass: 'is-hidden',
        animationSpeed: 500,
        spacing: 8,
        visiblePortion: 8.5,
        defaultMaxWidth: 320,
        scrollbarFallback: 20
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
            window.clearTimeout( isScrolling );

            // Set a timeout to run after scrolling ends
            isScrolling = setTimeout(function() {
                // Run the callback
                callback();
            }, 122);
        }, false);
    };

    /**
     * Get scrollbar size
     */
    function getScrollbarSize(fallback) {
        // Outer div
        var outer = document.createElement("div");
        outer.style.visibility = "hidden";
        outer.style.width = "100px";
        outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps
        document.body.appendChild(outer);
        var widthNoScroll = outer.offsetWidth;

        // force scrollbars
        outer.style.overflow = "scroll";

        // Inner div
        var inner = document.createElement("div");
        inner.style.width = "100%";
        outer.appendChild(inner);
        var widthWithScroll = inner.offsetWidth;

        // remove divs
        outer.parentNode.removeChild(outer);

        // Set fallback
        if (widthNoScroll == widthWithScroll) {
            if (!fallback) { fallback = settings.scrollbarFallback }
            return fallback;
        }

        return widthNoScroll - widthWithScroll;
    }

    /**
     * Add buttons to the wrapper
     */
    function addButtons($swipeWrapper) {
        // Create elements
        var $prevButton = document.createElement('button'),
            $nextButton = document.createElement('button');

        // Add classes and hide prev button by default
        $prevButton.classList.add(settings.swiperPrevClass);
        $prevButton.style.display = 'none';
        $nextButton.classList.add(settings.swiperNextClass);

        // Add to the DOM
        $swipeWrapper.parentNode.insertBefore($prevButton, $swipeWrapper);
        $swipeWrapper.parentNode.insertBefore($nextButton, $swipeWrapper.nextSibling);

        // Add event listeners
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
     * Initialize the swipers
     */
    function initialize(settings) {


        // Get all page swipers
        var swipers = document.querySelectorAll(settings.selector);

        // See if any exist
        if ( swipers && swipers.length ) {

            // Loop through
            forEach(swipers, function($swiper) {

                // Create elements
                var $swipeWrapper = document.createElement('div'),
                    $swipeContainer = document.createElement('div');

                // Add classes
                $swipeWrapper.classList.add(settings.swiperWrapperClass);
                $swipeContainer.classList.add(settings.swiperContainerClass);

                // Add to DOM
                $swiper.parentNode.insertBefore($swipeContainer, $swiper);
                $swipeContainer.appendChild($swiper);
                $swipeContainer.parentNode.insertBefore($swipeWrapper, $swipeContainer);
                $swipeWrapper.appendChild($swipeContainer);

                // Add buttons
                addButtons($swipeContainer);

                // Set widths
                setWidths($swiper);

                // Check for scrollstop
                scrollStop($swipeContainer, function() {
                    //console.log($swipeContainer, 'stopped');
                    // @TODO: jump to right one after manual scroll? Maybe with a setting?
                });

                // Add scroll listener
                $swipeContainer.addEventListener('scroll', scrollHandler, false);

            });
        }
    }

    /**
     * Get window width
     */
    var winWidth = function() {
        var documentElement = document.documentElement;
        var body = document.getElementsByTagName('body')[0];
        return window.innerWidth || documentElement.clientWidth || body.clientWidth;
    };

    /**
     * Get current spacing
     */
    var currentSpacing = function($swiper, windowWidth) {

        // Grab value
        var spacing = JSON.parse($swiper.getAttribute('data-scroll-spacing')) || settings.spacing;

        // If value is an object
        if (spacing !== null && typeof spacing === 'object') {

            // Loop through
            forEach(spacing, function(value, i) {

                // If window is larger than largest width
                if ( windowWidth >= value.width ) {
                    spacing = value.spacing;
                }

                // If window is larger than current width but smaller than next width
                else if ( windowWidth >= value.width && windowWidth < spacing[i + 1].width ) {
                    spacing = value.spacing;
                }
            });
        }

        return parseInt(spacing, 10);
    };

    /**
     * calculateAmounts
     * Calculate amounts of items to show / scroll
     */
    var calculateAmounts = function($swiper) {
        var containerWidth = $swiper.parentNode.offsetWidth;
        var itemSpacing = currentSpacing($swiper, winWidth());
        var itemMaxWidth = parseInt($swiper.getAttribute('data-scroll-maxwidth'), 10) || settings.defaultMaxWidth;
        var amountToScroll = Math.ceil((containerWidth * (settings.visiblePortion / 10)) / (itemMaxWidth + (itemSpacing * 2)));
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
                itemSpacing = currentSpacing($swiper, winWidth()),
                $swipeContainer = $swiper.parentNode;

            // Set styling for individual items
            forEach(items, function($item) {
                $item.style.float = 'left';
                $item.style.width = itemsScrollWidth + '%';
                $item.style.paddingLeft = itemSpacing + 'px';
                $item.style.paddingRight = itemSpacing + 'px';
            });

            // Set styling for the parent
            $swipeContainer.style.marginLeft = -(itemSpacing) + 'px';
            $swipeContainer.style.marginRight = -(itemSpacing) + 'px';
            $swiper.style.width = parentWidth + '%';

            // Add padding to hide scrollbar
            $swipeContainer.style.marginBottom = -(getScrollbarSize() * 2) + 'px';
            $swiper.style.paddingBottom = getScrollbarSize() + 'px';

            // Hide buttons when they're not needed anymore
            if ($swipeContainer.offsetWidth >= $swiper.offsetWidth ) {
                hideButtons($swipeContainer.parentNode);
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
        var $swipe = $swipeWrapper.querySelector('[data-natural-swipe]');
        var scrollAmount = calculateAmounts($swipe);
        var itemWidth = ($swipeWrapper.querySelector('.item').offsetWidth) * scrollAmount;
        var padding = (swipewrapperWidth - itemWidth) / 2;
        var currentAmount = Math.ceil(currentscroll / itemWidth) - 1;
        var negativeMargin = Math.abs(parseInt(window.getComputedStyle($swipeContainer).marginLeft, 10));
        if (direction == 'next') { currentAmount = Math.ceil(currentscroll / itemWidth) + 1; }
        var newPosition = (itemWidth * currentAmount) - (padding + (negativeMargin));
        // when scrolling more items than are still available
        if (newPosition > ($swipe.offsetWidth - swipewrapperWidth) ) {
            newPosition = $swipe.offsetWidth - swipewrapperWidth;
        }
        // Animate
        TinyAnimate.animateCSS($swipeContainer, 'scrollLeft', '', currentscroll, newPosition, settings.animationSpeed, 'easeOutQuart', false);
    }

    /**
     * calculateScroll
     */
    var calculateScroll = function() {

        // Get window width
        var windowWidth = winWidth();

        // Get all page swipers
        var swipers = document.querySelectorAll(settings.selector);

        // See if any exists
        if ( swipers && swipers.length ) {

            // Loop through
            forEach(swipers, function ($swiper) {

                // Get value
                var scrollUntil = parseInt($swiper.getAttribute('data-scroll-until'), 10) || 9999;

                // Enable swipe for swiper element
                if (windowWidth < scrollUntil) {
                    vanillaSwiper.enable($swiper);
                }

                // Disable swipe for swiper element
                else {
                    vanillaSwiper.disable($swiper);
                }

                // Show/hide buttons
                calculateButtonVisibility($swiper.parentNode);
            });
        }
    };

    /**
     * Get current wrapper
     */

    function getWrapper($swiper) {
        var $swipeContainer = $swiper.parentNode;
        return $swipeContainer.parentNode;
    }

    /**
     * Calculate button visibility
     */

    function calculateButtonVisibility($swipeContainer) {

        // Get elements
        var $swipeWrapper = $swipeContainer.parentNode;
        var $prevButton = $swipeWrapper.querySelector('.' + settings.swiperPrevClass);
        var $nextButton = $swipeWrapper.querySelector('.' + settings.swiperNextClass);

        // Show / hide prev button
        if ($swipeContainer.scrollLeft > 0) {
            $prevButton.style.display ='block';
        } else {
            $prevButton.style.display ='none';
        }

        // Show/hide next button
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

        // @TODO: make possible to destroy swipers

        // Reset variables
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


/**
 * TinyAnimate
 *  version 0.3.0
 *
 * Source:  https://github.com/branneman/TinyAnimate
 * Author:  Bran van der Meer <branmovic@gmail.com> (http://bran.name/)
 * License: MIT
 *
 * Functions:
 *  TinyAnimate.animate(from, to, duration, update, easing, done)
 *  TinyAnimate.animateCSS(element, property, unit, from, to, duration, easing, done)
 *  TinyAnimate.cancel(animation)
 *
 * Parameters:
 *  element   HTMLElement        A dom node
 *  property  string             Property name, as available in element.style, i.e. 'borderRadius', not 'border-radius'
 *  unit      string             Property unit, like 'px'
 *  from      int                Property value to animate from
 *  to        int                Property value to animate to
 *  duration  int                Duration in milliseconds
 *  update    function           Function to implement updating the DOM, get's called with a value between `from` and `to`
 *  easing    string | function  Optional: A string when the easing function is available in TinyAnimate.easings,
 *                                or a function with the signature: function(t, b, c, d) {...}
 *  done      function           Optional: To be executed when the animation has completed.
 *
 * Returns:
 *  animation object             Animation object that can be canceled.
 */
/**
 * Universal Module Dance
 *  config: CommonJS Strict, exports Global, supports circular dependencies
 *  https://github.com/umdjs/umd/
 */
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['exports'], function(exports) {
            factory((root.TinyAnimate = exports));
        });
    } else if (typeof exports === 'object') {
        factory(exports);
    } else {
        factory((root.TinyAnimate = {}));
    }
}(this, function(exports) {
    /**
     * TinyAnimate.animate()
     */
    exports.animate = function(from, to, duration, update, easing, done) {
        // Early bail out if called incorrectly
        if (typeof from !== 'number' ||
            typeof to !== 'number' ||
            typeof duration !== 'number' ||
            typeof update !== 'function')
            return;
        // Determine easing
        if (typeof easing === 'string' && easings[easing]) {
            easing = easings[easing];
        }
        if (typeof easing !== 'function') {
            easing = easings.linear;
        }
        // Create mock done() function if necessary
        if (typeof done !== 'function') {
            done = function() {};
        }
        // Pick implementation (requestAnimationFrame | setTimeout)
        var rAF = window.requestAnimationFrame || function(callback) {
                window.setTimeout(callback, 1000 / 60);
            };
        // Animation loop
        var canceled = false;
        var change = to - from;
        function loop(timestamp) {
            if (canceled) {
                return;
            }
            var time = (timestamp || +new Date()) - start;
            if (time >= 0) {
                update(easing(time, from, change, duration));
            }
            if (time >= 0 && time >= duration) {
                update(to);
                done();
            } else {
                rAF(loop);
            }
        }
        update(from);
        // Start animation loop
        var start = window.performance && window.performance.now ? window.performance.now() : +new Date();
        rAF(loop);
        return {
            cancel: function() {
                canceled = true;
            }
        };
    };
    /**
     * TinyAnimate.animateCSS()
     *  Shortcut method for animating css properties
     */
    exports.animateCSS = function(element, property, unit, from, to, duration, easing, done) {
        var update = function(value) {
            element[property] = value + unit;
        };
        return exports.animate(from, to, duration, update, easing, done);
    };
    /**
     * TinyAnimate.cancel()
     *  Method for canceling animations
     */
    exports.cancel = function(animation) {
        if (!animation) {
            return;
        }
        animation.cancel();
    };
    /**
     * TinyAnimate.easings
     *  Adapted from jQuery Easing
     */
    var easings = exports.easings = {};
    easings.easeOutQuart = function(t, b, c, d) {
        return -c * ((t = t / d - 1) * t * t * t - 1) + b;
    };
}));