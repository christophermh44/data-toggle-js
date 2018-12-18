/*
 The MIT License (MIT)

 Copyright (c) 2016 Christopher Machicoane-Hurtaud

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

;(function(window, document) {
    'use strict';

    window.DataToggle = function(initSettings, directLoad) {
        /**
         * Private function that creates array of values from object
         * @param o object to use
         * @returns {Array} array of values from object
         */
        function objectValues(o) {
            var values = [];
            for (var key in o) {
                if (o.hasOwnProperty(key)) {
                    values.push(o[key]);
                }
            }
            return values;
        }

        /**
         * For-each binding for node list iterations
         * @param elements dom elements to iterate
         * @param callback item callback function
         */
        function forEach(elements, callback) {
            [].forEach.call(elements, callback);
        }

        /**
         * Private function with infinite parameters that extends a javascript object with other ones.
         * @returns {*|{}} extended object or empty object
         */
        function extend() {
            for (var i = 1; i < arguments.length; i++) {
                for (var key in arguments[i]) {
                    if (arguments[i].hasOwnProperty(key)) {
                        arguments[0][key] = arguments[i][key];
                    }
                }
            }
            return arguments[0];
        }

        /**
         * Private function that checks if an element matches a selector
         * @param el element to check
         * @param selector CSS-like selector
         * @returns {*} true if the element matches.
         */
        function matches(el, selector) {
            if (!el) {
                return false;
            }
            var matchesCallable = (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector);
            if (!matchesCallable) {
                return false;
            }
            return matchesCallable.call(el, selector);
        }

        /**
         * Private function that filters a node list by a selector. Uses private function matches()
         * @param els collection of elements
         * @param selector selector to check
         * @returns {Array} array of filtered elements
         */
        function filter(els, selector) {
            var filtered = [];
            var test = typeof selector === 'string'
                ? function(a, b) {
                return matches(a, b);
            }
                : function(a, b) {
                return a === b;
            };
            forEach(els, function(el) {
                if (test(el, selector)) {
                    filtered.push(el);
                }
            });
            return filtered;
        }

        /**
         * Private function that triggers a custom event on an element
         * @param element element that will be used
         * @param event event name
         * @param data additionnal data for the event
         */
        function triggerEvent(element, event, data) {
            var e;
            if (window.CustomEvent) {
                e = new CustomEvent(event, {detail: data});
            } else {
                e = document.createEvent('CustomEvent');
                e.initCustomEvent(event, true, true, data);
            }
            element.dispatchEvent(e);
        }

        /**
         * Private function that adds classes to elements
         * @param elements array of elements
         * @param classes array of classes
         */
        function addClasses(elements, classes) {
            forEach(elements, function(element) {
                forEach(classes, function(cssClass) {
                    element.classList.add.apply(element.classList, cssClass);
                });
            });
        }

        /**
         * Private function that removes classes from elements
         * @param elements array of elements
         * @param classes array of classes
         */
        function removeClasses(elements, classes) {
            forEach(elements, function(element) {
                forEach(classes, function(cssClass) {
                    element.classList.remove.apply(element.classList, cssClass);
                });
            });
        }

        /**
         * Private function that toggles classes on elements
         * @param elements array of elements
         * @param classes array of classes
         */
        function toggleClasses(elements, classes) {
            forEach(elements, function(element) {
                forEach(classes, function(cssClass) {
                    element.classList.toggle.apply(element.classList, cssClass);
                });
            });
        }

        var instance = {
            /**
             * Object that contains all events handlers on each triggers
             */
            binds: {},

            /**
             * Settings and callbacks that can be customized to adapt to your needs
             */
            settings: {
                /**
                 * Compute list of all triggers
                 * @returns {NodeList} list of elements
                 */
                dataToggleElements: function() {
                    return document.querySelectorAll('[data-toggle]');
                },

                /**
                 * Compute list of all identical triggers ( = same toggle expression)
                 * @param toggleExpression filtering expression
                 * @returns {NodeList} list of elements
                 */
                dataToggleSameElements: function(toggleExpression) {
                    return document.querySelectorAll('[data-toggle="' + toggleExpression + '"]');
                },

                /**
                 * Compute list of all triggers that belongs to a same group
                 * @param group group name
                 * @returns {NodeList} list of elements
                 */
                dataToggleGroupElements: function(group) {
                    return document.querySelectorAll('[data-toggle-group="' + group + '"]');
                },

                /**
                 * Gets the toggling expression
                 * @param element element that contains the expression
                 * @returns {*} toggling expression
                 */
                target: function(element) {
                    return element.getAttribute('data-toggle');
                },

                /**
                 * Gets the groups names
                 * @param element element that contains the groups names
                 * @returns {string|*} groups names
                 */
                groups: function(element) {
                    return element.getAttribute('data-toggle-group');
                },

                /**
                 * Gets the events names
                 * @param element element that contains the events names
                 * @returns {string|*} events names
                 */
                events: function(element) {
                    return element.getAttribute('data-toggle-event');
                },

                /**
                 * Gets the classes names
                 * @param element element that contains the classes names
                 * @returns {string|*} classes names
                 */
                classes: function(element) {
                    return element.getAttribute('data-toggle-class');
                },

                /**
                 * Gets the method name
                 * @param element element that contains the method name
                 * @returns {string} method name
                 */
                method: function(element) {
                    return element.getAttribute('data-toggle-method');
                },

                /**
                 * Test if data-toggle has to bubble the event
                 * @param element element that contains the attribute or not
                 * @returns {boolean} true if is has to bubble, false otherwise
                 */
                isBubble: function(element) {
                    return element.hasAttribute('data-toggle-bubble');
                },

                /**
                 * Default classes that will be added to triggers and targets
                 */
                activeClasses: ['active'],

                /**
                 * Function allowing you to prevent data-toggle behavior on other components you are using
                 * @param $element
                 * @param $target
                 * @param $el
                 * @param options
                 * @returns {boolean} false if you want to use data-toggle after the triggered event, true otherwise.
                 */
                preventingCallback: function($element, $target, $el, options) {
                    return false;
                },

                /**
                 * Methods to trigger data-toggle event. Defaut is the click on element. But you can add some
                 * behaviors, on check and radio input types for examples (their states is indicated by the check mark)
                 */
                triggerMethods: {
                    button: {
                        /**
                         * Triggering and event binding
                         * @param element element that will receive the event binding
                         * @param target target of the element
                         * @param options data-toggle settings
                         * @param callback callback to call when the event is triggered and valid. Please note that
                         *                 this callback will take one parameter (the JS Event object) and one optional
                         *                 parameter: an object that can contain the 'status' to apply and a 'callback'
                         *                 that will be called to manually change the status of the triggers.
                         * @returns {{click: handleClick}} Object containing the binding functions of events
                         */
                        trigger: function(element, target, options, callback) {
                            var handleClick = function(event) {
                                return callback(event);
                            };
                            element.addEventListener('click', handleClick, false);
                            return {
                                click: handleClick
                            };
                        },
                        /**
                         * Preventing callback for trigger methods can be useful to force data-toggle to not be executed
                         * when clicking on some of your components
                         * @param $element triggering element
                         * @param $target targeted elements
                         * @param $el event element
                         * @param options data-toggle settings
                         * @returns {boolean} true if you want to stop data-toggle, false otherwise.
                         */
                        preventingCallback: function(event, $element, $target, $el, options) {
                            return false;
                        }
                    },
                    check: {
                        trigger: function(element, target, options, callback) {
                            var handleChange = function(event) {
                                var status = element.checked;
                                /*
                                 this callback updates checkboxes. Without this callback, classes will be added to
                                 controls, but they won't change their status.
                                 */
                                return callback(event, {
                                    status: status,
                                    callback: function(el, elStatus) {
                                        if (el.hasAttribute('type')
                                            && (el.getAttribute('type') === 'radio' || el.getAttribute('type') === 'checkbox')) {
                                            if (elStatus === true || elStatus === false) {
                                                el.checked = elStatus;
                                            } else {
                                                el.checked = !el.checked;
                                            }
                                        }
                                    }
                                });
                            };
                            element.addEventListener('change', handleChange, false);
                            return {
                                change: handleChange
                            };
                        },
                        // Here we have to cancel data-toggle behavior when clicking on labels associated to input.
                        preventingCallback: function(event, $element, $target, $el, options) {
                            if ($el.tagName.toLowerCase() === 'label' && $el.hasAttribute('for')) {
                                var forElement = document.getElementById($el.getAttribute('for'));
                                var dataToggles = options.dataToggleElements();
                                if (filter(dataToggles, forElement).length > 0) {
                                    return true;
                                }
                            }
                            return false;
                        }
                    }
                },

                /**
                 * Have to specify a default triggering behavior to data-toggle.
                 * @see triggerMethods to know which key you want to use.
                 */
                defaultTriggerMethod: 'button'
            },

            /**
             * Dispatch all custom events
             * @param events list of events to dispatch
             * @param element list of elements to trigger events on
             * @param status details of event
             */
            dispatchEvents: function(events, element, status) {
                for (var e = 0; e < events.length; ++e) {
                    triggerEvent(element, events[e], [status]);
                }
            },

            /**
             * Removes classes from other triggers and targets concerned by a same group
             * @param $element actual trigger
             * @param groups array of groups names
             * @param classes array of classes names
             * @param events array of custom events to trigger
             * @param additional additional data
             */
            handleGroupedToggles: function($element, groups, classes, events, additional) {
                var self = this;
                var dataToggleGroupElements = function(groupElement) {
                    if (groupElement !== $element) {
                        removeClasses([groupElement], classes);
                        if (additional.hasOwnProperty('callback')) {
                            additional.callback(groupElement, false);
                        }
                        forEach(document.querySelectorAll(self.settings.target(groupElement)), function(destinationElement) {
                            self.dispatchEvents(events, destinationElement, false);
                            removeClasses([destinationElement], classes);
                        });
                    }
                };
                for (var g = 0; g < groups.length; ++g) {
                    forEach(self.settings.dataToggleGroupElements(groups[g]), dataToggleGroupElements);
                }
            },

            /**
             * Toggles classes on other triggers and targets concerned by the same toggling expression
             * @param $target targeted elements
             * @param target toggling expression
             * @param classes array of classes
             * @param events array of custom events to trigger
             * @param additional additional data
             */
            handleSameToggles: function($target, target, classes, events, additional) {
                var self = this;
                forEach(self.settings.dataToggleSameElements(target), function(sameElement) {
                    var status = filter($target, '.' + classes.join(' ')).length > 0;
                    (status ? addClasses : removeClasses)([sameElement], classes);
                    if (additional.hasOwnProperty('callback')) {
                        additional.callback(sameElement, status);
                    }
                    forEach($target, function(targetElement) {
                        self.dispatchEvents(events, targetElement, status);
                    });
                });
            },

            /**
             * Checks if the data-toggle has to be executed or not
             * @param $element triggering element
             * @param $el elements of event triggered
             * @param $target targeted elements
             * @param classes array of classes
             * @returns {*|boolean} true if the data-toggle behavior has to be cancelled, false otherwise
             */
            handlePreventing: function(event, $element, $el, $target, classes) {
                if (filter(this.settings.dataToggleElements(), $el).length > 0 && $element !== $el) {
                    return true;
                }
                var preventingByTriggerType = false;
                for (var trigger in this.settings.triggerMethods) {
                    if (this.settings.triggerMethods.hasOwnProperty(trigger) && !preventingByTriggerType) {
                        preventingByTriggerType = this.settings.triggerMethods[trigger].preventingCallback(event, $element, $target, $el, this.settings);
                    }
                }
                return preventingByTriggerType || this.settings.preventingCallback(event, $element, $target, $el, this.settings);
            },

            /**
             * main data-toggle execution
             * @param event event triggered
             * @param element triggering elements
             * @param target targeted elements
             * @param options data-toggle settings
             * @param additional additional data
             * @returns {boolean} as a system event handling function, it has to return a boolean to indicates if the event can be bubbled or not.
             */
            dataToggle: function(event, element, target, options, additional) {
                var $el = event.target;
                var $element = typeof element === 'string' ? document.querySelectorAll(element) : element;
                var $target = typeof target === 'string' ? document.querySelectorAll(target) : target;
                var groups = (typeof options.groups === 'string' ? options.groups.split(' ') : options.groups) || [];
                var events = (typeof options.events === 'string' ? options.events.split(' ') : options.events) || [];
                var classes = (typeof options.classes === 'string' ? options.classes.split(' ') : options.classes) || objectValues(this.settings.activeClasses);
                additional = additional || {};
                if (this.handlePreventing(event, $element, $el, $target, classes)) {
                    return true;
                }
                if (!(this.settings.isBubble($element))) {
                    event.preventDefault();
                }
                this.handleGroupedToggles($element, groups, classes, events, additional);
                if (additional.hasOwnProperty('status')) {
                    (additional.status ? addClasses : removeClasses)($target, classes);
                } else {
                    toggleClasses($target, classes);
                }
                this.handleSameToggles($target, target, classes, events, additional);
                return !(event.defaultPrevented);
            },

            /**
             * Stores the binds of an element
             * @param element triggering element
             * @param binds events handling function
             */
            storeBind: function(element, binds) {
                if (this.binds[this.settings.target(element)] === undefined) {
                    this.binds[this.settings.target(element)] = [];
                }
                this.binds[this.settings.target(element)].push({
                    element: element,
                    binds: binds
                });
            },

            /**
             * Binds main data-toggle execution to elements
             * @param element triggering elements
             * @param target targeted elements
             * @param options data-toggle settings
             */
            bind: function(element, target, options) {
                var self = this;
                options = options || {};
                var method = this.settings.triggerMethods[
                    this.settings.triggerMethods.hasOwnProperty(options.method)
                        ? options.method
                        : this.settings.defaultTriggerMethod
                    ].trigger;
                var binds = method(element, target, options, function(event, additional) {
                    if (!event.defaultPrevented) {
                        self.dataToggle.call(self, event, element, target, options, additional);
                    }
                });
                self.storeBind(element, binds);
            },

            /**
             * Binds all data-toggles found in page
             */
            bindAll: function() {
                var self = this;
                forEach(this.settings.dataToggleElements(), function(element) {
                    var target = self.settings.target(element);
                    var groups = self.settings.groups(element);
                    var events = self.settings.events(element);
                    var classes = self.settings.classes(element);
                    var method = self.settings.method(element);
                    self.bind(element, target, {
                        groups: groups,
                        events: events,
                        classes: classes,
                        method: method
                    });
                });
            },

            /**
             * Unbind main data-toggle execution from elements
             * @param toggleExpression toggling expression
             */
            unbind: function(toggleExpression) {
                if (!this.binds.hasOwnProperty(toggleExpression)) {
                    return;
                }
                var elementBinds = this.binds[toggleExpression];
                for (var i = 0; i < elementBinds.length; ++i) {
                    var eb = elementBinds[i];
                    var element = eb.element;
                    for (var eventName in eb.binds) {
                        if (eb.binds.hasOwnProperty(eventName)) {
                            var eventHandler = eb.binds[eventName];
                            element.removeEventListener(eventName, eventHandler);
                        }
                    }
                }
                delete this.binds[toggleExpression];
            },

            /**
             * Unbind all data-toggle found in the page
             */
            unbindAll: function() {
                for (var b in this.binds) {
                    if (this.binds.hasOwnProperty(b)) {
                        this.unbind(b);
                    }
                }
            },

            /**
             * Refresh binds. Could be useful when dynamic content is added or removed inside the current page.
             */
            refresh: function() {
                this.unbindAll();
                this.bindAll();
            },

            /**
             * Initialisation call
             * @param settings data-toggle settings object that will extend the default behavior.
             * @param loadDirect if true, do not wait for window to load
             */
            init: function(settings, loadDirect) {
                var self = this;
                this.settings = extend({}, self.settings, settings);
                if (!!loadDirect) {
                    self.bindAll();
                } else {
                    window.addEventListener('load', function() {
                        self.bindAll();
                    }, false);
                }
                return self;
            }
        };

        return instance.init(initSettings, directLoad);
    };
})(window, document);
