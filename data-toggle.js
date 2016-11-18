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

    // compatibility fixes
    if (!(NodeList.prototype.hasOwnProperty('forEach'))) {
        NodeList.prototype.forEach = Array.prototype.forEach;
    }
    if (!(Object.prototype.hasOwnProperty('values'))) {
        Object.prototype.values = function(o) {
            var values = [];
            for (var key in o) {
                if (o.hasOwnProperty(key)) {
                    values.push(o[key]);
                }
            }
            return values;
        }
    }

    window.DataToggle = function(initSettings, directLoad) {
        /**
         * Private function that extends a javascript object with other ones.
         * @param out objects to combine
         * @returns {*|{}} extended object or empty object
         */
        function extend(out) {
            out = out || {};
            for (var i = 1; i < arguments.length; i++) {
                var obj = arguments[i];
                if (!obj) {
                    continue;
                }
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (typeof obj[key] === 'object') {
                            out[key] = extend(out[key], obj[key]);
                        } else {
                            out[key] = obj[key];
                        }
                    }
                }
            }
            return out;
        }

        /**
         * Private function that checks if an element matches a selector
         * @param el element to check
         * @param selector CSS-like selector
         * @returns {*} true if the element matches.
         */
        function matches(el, selector) {
            if (!el) return false;
            return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
        }

        /**
         * Private function that checks if an element belongs to another
         * @param el supposed parent element
         * @param child supposed child element
         * @returns {boolean|*} true if the child element is contained by the supposed parent
         */
        function contains(el, child) {
            return el !== child && el.contains(child);
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
                } : function(a, b) {
                    return a === b;
                };
            els.forEach(function(el) {
                if (test(el, selector)) {
                    filtered.push(el);
                }
            });
            return filtered;
        }

        /**
         * Private function that returns the first item of an array if the given list is an array. Otherwise, it returns the object itself.
         * @param list object to use
         * @returns {*} object isolated
         */
        function isolate(list) {
            return (list instanceof Array || list instanceof NodeList)
                ? list.length > 0
                    ? list[0]
                    : null
                : list;
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
            var addClassesHandle = function(element) {
                for (var c = 0; c < classes.length; ++c) {
                    var className = classes[c];
                    if (!element.classList.contains(className)) {
                        element.classList.add(className);
                    }
                }
            };
            if (elements instanceof Array || elements instanceof NodeList) {
                elements.forEach(addClassesHandle);
            } else {
                addClassesHandle(elements);
            }
        }

        /**
         * Private function that removes classes from elements
         * @param elements array of elements
         * @param classes array of classes
         */
        function removeClasses(elements, classes) {
            var removeClassesHandle = function(element) {
                for (var c = 0; c < classes.length; ++c) {
                    var className = classes[c];
                    if (element.classList.contains(className)) {
                        element.classList.remove(className);
                    }
                }
            };
            if (elements instanceof Array || elements instanceof NodeList) {
                elements.forEach(removeClassesHandle);
            } else {
                removeClassesHandle(elements);
            }
        }

        /**
         * Private function that toggles classes on elements
         * @param elements array of elements
         * @param classes array of classes
         */
        function toggleClasses(elements, classes) {
            var toggleClassesHandle = function(element) {
                for (var c = 0; c < classes.length; ++c) {
                    var className = classes[c];
                    if (element.classList.contains(className)) {
                        element.classList.remove(className);
                    } else {
                        element.classList.add(className);
                    }
                }
            };
            if (elements instanceof Array || elements instanceof NodeList) {
                elements.forEach(toggleClassesHandle);
            } else {
                toggleClassesHandle(elements);
            }
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
                 * Intialize events handling
                 * @param element triggering element
                 * @param target targeted elements
                 * @param options settings of data-toggle
                 * @param callback function to call when event is triggered and valid
                 * @returns {*} This function had to return an object containing each handles referenced by their event type.
                 */
                triggers: function(element, target, options, callback) {
                    var handleClick = function(event) {
                        return callback(event);
                    };
                    var handleKeyUp = function(event) {
                        if (event.which === 13 || event.keyCode === 13) {
                            event.preventDefault();
                            event.stopPropagation();
                            return callback(event);
                        }
                    };
                    element.addEventListener('click', handleClick);
                    element.addEventListener('keyup', handleKeyUp);
                    return {
                        click: handleClick,
                        keyup: handleKeyUp
                    };
                },

                /**
                 * Default classes that will be added to triggers and targets
                 */
                activeClasses: ['active'],

                /**
                 * Function allowing you to prevent data-toggle behavior on other components you are using
                 * @returns {boolean} false if you want to use data-toggle after the triggered event, true otherwise.
                 */
                preventingCallback: function($element, $target, $el, options) {
                    return false;
                }
            },

            /**
             * Checks if the element concerned by the triggered event is contained inside an already toggled one.
             * @param $element triggering element
             * @param $target targeted elements
             * @param $el element of the event
             * @param classes classes to check
             * @returns {boolean} true if the element is contained, false otherwise
             */
            isContained: function($element, $target, $el, classes) {
                var contained = false;
                if (matches(isolate($target), '.' + classes.join(', .'))) {
                    for (var i = 0; i < $el.length; ++i) {
                        var containing = false;
                        for (var j = 0; j < $target.length; ++j) {
                            if (contains($target[j], $el[i])) {
                                containing = true;
                            }
                        }
                        if (containing && !matches($target, $element[i]) && !matches($target.parentNode, $el[i])) {
                            contained = true;
                        }
                    }
                }
                return contained;
            },

            /**
             * Removes classes from other triggers and targets concerned by a same group
             * @param $element actual trigger
             * @param groups array of groups names
             * @param classes array of classes names
             * @param events array of custom events to trigger
             */
            handleGroupedToggles: function($element, groups, classes, events) {
                var self = this;
                if (groups.length > 0) {
                    for (var i = 0; i < groups.length; ++i) {
                        var group = groups[i];
                        self.settings.dataToggleGroupElements(group).forEach(function(groupElement) {
                            if (groupElement !== $element) {
                                removeClasses([groupElement], classes);
                                var destination = self.settings.target(groupElement);
                                document.querySelectorAll(destination).forEach(function(destinationElement) {
                                    for (var j = 0; j < events.length; ++j) {
                                        var ev = events[j];
                                        triggerEvent(destinationElement, ev, [false]);
                                    }
                                    removeClasses([destinationElement], classes);
                                });
                            }
                        });
                    }
                }
            },

            /**
             * Toggles classes on other triggers and targets concerned by the same toggling expression
             * @param $target targeted elements
             * @param target toggling expression
             * @param classes array of classes
             * @param events array of custom events to trigger
             */
            handleSameToggles: function($target, target, classes, events) {
                var self = this;
                self.settings.dataToggleSameElements(target).forEach(function(sameElement) {
                    var status = filter($target, '.' + classes.join(' ')).length > 0;
                    if (status) {
                        addClasses([sameElement], classes);
                    } else {
                        removeClasses([sameElement], classes);
                    }
                    for (var i = 0; i < events.length; ++i) {
                        var ev = events[i];
                        $target.forEach(function(targetElement) {
                            triggerEvent(targetElement, ev, [status]);
                        });
                    }
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
            handlePreventing: function($element, $el, $target, classes) {
                var self = this;
                var isContained = self.isContained($element, $target, $el, classes);
                var dtElements = self.settings.dataToggleElements();
                return (
                    (isContained && !(filter(dtElements, $el).length > 0) && !(filter(dtElements, $el.parentNode)))
                    || self.settings.preventingCallback($element, $target, $el, self.settings)
                );
            },

            /**
             * main data-toggle execution
             * @param event event triggered
             * @param element triggering elements
             * @param target targeted elements
             * @param options data-toggle settings
             * @returns {boolean} as a system event handling function, it has to return a boolean to indicates if the event can be bubbled or not.
             */
            dataToggle: function(event, element, target, options) {
                var self = this;
                var $el = [event.target];
                var $element = typeof element === 'string' ? document.querySelectorAll(element) : element;
                var $target = typeof target === 'string' ? document.querySelectorAll(target) : target;
                var groups = (typeof options.groups === 'string' ? options.groups.split(' ') : options.groups) || [];
                var events = (typeof options.events === 'string' ? options.events.split(' ') : options.events) || [];
                var classes = (typeof options.classes === 'string' ? options.classes.split(' ') : options.classes) || Object.values(self.settings.activeClasses);
                if (self.handlePreventing($element, $el, $target, classes)) {
                    return true;
                }
                event.preventDefault();
                self.handleGroupedToggles($element, groups, classes, events);
                toggleClasses($target, classes);
                self.handleSameToggles($target, target, classes, events);
                return false;
            },

            /**
             * Stores the binds of an element
             * @param element triggering element
             * @param binds events handling function
             */
            storeBind: function(element, binds) {
                var self = this;
                if (self.binds[self.settings.target(element)] === undefined) {
                    self.binds[self.settings.target(element)] = [];
                }
                self.binds[self.settings.target(element)].push({
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
                options = options || {groups: null, events: null, classes: null};
                var binds = self.settings.triggers(element, target, options, function(event) {
                    if (!event.defaultPrevented) {
                        self.dataToggle.call(self, event, element, target, options);
                    }
                });
                self.storeBind(element, binds);
            },

            /**
             * Binds all data-toggles found in page
             */
            bindAll: function() {
                var self = this;
                this.settings.dataToggleElements().forEach(function(element) {
                    var target = self.settings.target(element);
                    var groups = self.settings.groups(element);
                    var events = self.settings.events(element);
                    var classes = self.settings.classes(element);
                    self.bind(element, target, {
                        groups: groups,
                        events: events,
                        classes: classes
                    });
                });
            },

            /**
             * Unbind main data-toggle execution from elements
             * @param toggleExpression toggling expression
             */
            unbind: function(toggleExpression) {
                var self = this;
                if (!self.binds.hasOwnProperty(toggleExpression)) {
                    return;
                }
                var elementBinds = self.binds[toggleExpression];
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
                delete self.binds[toggleExpression];
            },

            /**
             * Unbind all data-toggle found in the page
             */
            unbindAll: function() {
                var self = this;
                for (var b in self.binds) {
                    if (self.binds.hasOwnProperty(b)) {
                        self.unbind(b);
                    }
                }
            },

            /**
             * Refresh binds. Could be useful when dynamic content is added or removed inside the current page.
             */
            refresh: function() {
                var self = this;
                self.unbindAll();
                self.bindAll();
            },

            /**
             * Initialisation call
             * @param settings data-toggle settings object that will extend the default behavior.
             * @param directLoad if true, do not wait for window to load
             */
            init: function(settings, directLoad) {
                var self = this;
                this.settings = extend({}, self.settings, settings);
                if (!!directLoad) {
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
