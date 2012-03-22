/**
* author Christopher Blum
* - based on the idea of Remy Sharp, http://remysharp.com/2009/01/26/element-in-view-event-plugin/
* - forked from http://github.com/zuk/jquery.inview/
*/
(function ($) {
    var inviewObjects = {}, viewportSize, viewportOffset,
      d = document, w = window, documentElement = d.documentElement, expando = $.expando;

    $.event.special.inview = {
        add: function (data) {
            inviewObjects[data.guid + "-" + this[expando]] = { data: data, $element: $(this) };
        },

        remove: function (data) {
            try { delete inviewObjects[data.guid + "-" + this[expando]]; } catch (e) { }
        }
    };

    function getViewportSize() {
        var mode, domObject, size = { height: w.innerHeight, width: w.innerWidth };

        // if this is correct then return it. iPad has compat Mode, so will
        // go into check clientHeight/clientWidth (which has the wrong value).
        if (!size.height) {
            mode = d.compatMode;
            if (mode || !$.support.boxModel) { // IE, Gecko
                domObject = mode === 'CSS1Compat' ?
          documentElement : // Standards
          d.body; // Quirks
                size = {
                    height: domObject.clientHeight,
                    width: domObject.clientWidth
                };
            }
        }

        return size;
    }

    function getViewportOffset() {
        return {
            top: w.pageYOffset || documentElement.scrollTop || d.body.scrollTop,
            left: w.pageXOffset || documentElement.scrollLeft || d.body.scrollLeft
        };
    }

    function checkInView() {
        var $elements = $(), elementsLength, i = 0;

        $.each(inviewObjects, function (i, inviewObject) {
            var selector = inviewObject.data.selector,
          $element = inviewObject.$element;
            $elements = $elements.add(selector ? $element.find(selector) : $element);
        });

        elementsLength = $elements.length;
        if (elementsLength) {
            viewportSize = viewportSize || getViewportSize();
            viewportOffset = viewportOffset || getViewportOffset();

            for (; i < elementsLength; i++) {
                // Ignore elements that are not in the DOM tree
                if (!$.contains(documentElement, $elements[i])) {
                    continue;
                }

                var $element = $($elements[i]),
            $d = $(d),
            elementSize = { height: $element.height(), width: $element.width() },
            elementOffset = $element.offset(),
            left, top,
                // Dual purpose data object for state and event payload
            data = $element.data('inview') || {
                isInView: false,
                left: 0,
                top: 0,
                visiblePartX: '',
                visiblePartY: '',
                ratioX: 0,
                ratioY: 0
            }

                // Don't ask me why because I haven't figured out yet:
                // viewportOffset and viewportSize are sometimes suddenly null in Firefox 5.
                // Even though it sounds weird:
                // It seems that the execution of this function is interferred by the onresize/onscroll event
                // where viewportOffset and viewportSize are unset
                if (!viewportOffset || !viewportSize) {
                    return;
                }

                if (elementOffset.top + elementSize.height > viewportOffset.top &&
            elementOffset.top < viewportOffset.top + viewportSize.height &&
            elementOffset.left + elementSize.width > viewportOffset.left &&
            elementOffset.left < viewportOffset.left + viewportSize.width) {
                    data.visiblePartX = (viewportOffset.left > elementOffset.left ?
            'right' : (viewportOffset.left + viewportSize.width) < (elementOffset.left + elementSize.width) ?
            'left' : 'both');
                    data.visiblePartY = (viewportOffset.top > elementOffset.top ?
            'bottom' : (viewportOffset.top + viewportSize.height) < (elementOffset.top + elementSize.height) ?
            'top' : 'both');
                    // Account for document scroll in calculations
                    left = ($d.scrollLeft() - elementOffset.left) * -1;
                    top = ($d.scrollTop() - elementOffset.top) * -1;
                    // Trigger the inview event whenever inview element has moved 
                    if (left !== data.left || top !== data.top) {
                        data.isInView = true;
                        data.left = left;
                        data.top = top;
                        // Include ratio of element's travel across viewport in event payload
                        data.ratioX = (left + elementSize.width) / (viewportSize.width + elementSize.width);
                        data.ratioY = (top + elementSize.height) / (viewportSize.height + elementSize.height);
                        $element.data('inview', data).trigger($.Event('inview', data));
                    }
                } else if (data.isInView) {
                    data.isInView = false;
                    $element.data('inview', data).trigger($.Event('inview', data));
                }
            }
        }
    }

    $(w).bind("scroll resize", function () {
        viewportSize = viewportOffset = null;
    });

    // Use setInterval in order to also make sure this captures elements within
    // "overflow:scroll" elements or elements that appeared in the dom tree due to
    // dom manipulation and reflow
    // old: $(window).scroll(checkInView);
    //
    // By the way, iOS (iPad, iPhone, ...) seems to not execute, or at least delays
    // intervals while the user scrolls. Therefore the inview event might fire a bit late there
    setInterval(checkInView, 30); // 30ms gives us about 30fps for more accurate inview and smoother ratio-based effects
})(jQuery);