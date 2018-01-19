/* It is usual to declare a data-toggle instance like this */

/* Helper functions */

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

function closest(el, fn) {
    return el && (fn(el) ? el : closest(el.parentNode, fn));
}

function parentMatches(el, selector) {
    return closest(el, function(e) {
        return matches(e, selector);
    }) !== null;
}

function ancestorIndex(el, selector) {
    var index = 0;
    while (el !== null && !matches(el, selector)) {
        el = el.parentNode;
        index++;
    }
    if (el === null) {
        return null;
    } else {
        return index;
    }
}

/* Data Toggle Initialisation */

(new DataToggle({
    preventingCallback: function(event, $element, $target, $el) {
        // The attribute data-toggle-target, put on a dropdown container, allows this container to not be closed when you click inside it.
        if (parentMatches($el, '[data-toggle-target]')) {
            var parentDataToggleTarget = ancestorIndex($el, '[data-toggle-target]');
            var parentDataToggle = ancestorIndex($el, '[data-toggle]');
            if (parentDataToggle === null) {
                return true;
            } else {
                return parentDataToggleTarget < parentDataToggle;
            }
        }
        // The attribute data-toggle-group-keep allows you to keep tabs opened when you click on it a second time.
        if (parentMatches($el, '[data-toggle-group-keep].active')) {
            event.preventDefault();
            return true;
        }
    }
}));
