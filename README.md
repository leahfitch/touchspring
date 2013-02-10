# TouchSpring

This is a simple library that implements the same type of model you see with kinetic scrolling in, e.g., Apple software but it's generic and can be used to add the same dynamics to interactions other than scrolling. It tracks x and y, there are no dependencies and it works with mouse or touch.

This software is fresh and not well tested so use at your own risk. Bug and enhancement reports are welcome.

## Basic usage

```html
<html>
    <head>TouchSpring example</head>
    <body>
        <script src="touchspring.js"></script>
        <script>
        // Set the bounds of the x and y position values.
        // A '-1' means no bound.
        TouchSpring.set_max_position(-1, -1)
        // Add a listener object to be notified of 
        // drag, deceleration and tap events.
        // See the source for a complete list of events.
        TouchSpring.set_listener({
            position_changed: function (ts)
            {
                var pos = ts.get_position()
                console.log(pos.x, pos.y)
            }
        })
        // Enable TouchSpring. This will capture mouse or touch 
        // events at the document element.
        TouchSpring.enable()
        </script>
    </body>
</html>
```