/* Drag and flick */
;(function ()
{
    var is_touch = ('ontouchstart' in window)
    
    var Vector = function (x,y)
    {
        this.x = x
        this.y = y
    }
    Vector.prototype = 
    {
        copy: function ()
        {
            return new Vector(this.x, this.y)
        },
        
        subtract: function (other)
        {
            return new Vector(this.x - other.x, this.y - other.y)
        },
        
        add: function (other)
        {
            return new Vector(this.x + other.x, this.y + other.y)
        }
    }
    
    window.TouchSpring = 
    {
        _events: {
            start: is_touch ? 'touchstart' : 'mousedown',
            move: is_touch ? 'touchmove' : 'mousemove',
            end: is_touch ? 'touchend' : 'mouseup'
        },
        _frame_rate: 1000 / 60,
        _enabled: false,
        _is_dragging: false,
        _is_decelerating: false,
        _deceleration_timer: null,
        _max_drag_watch_time: 100,
        _min_drag_distance: 5,
        _position: new Vector(0,0),
        _acceleration: 15,
        _velocity: new Vector(0,0),
        _min_position: new Vector(0,0),
        _max_position: new Vector(0,0),
        _last_event_time: 0,
        _friction: 0.95,
        _min_velocity_for_deceleration: 1,
        _min_velocity: 0.01,
        _max_velocity: 400,
        _drag_info: {},
        _listener: 
        {
            position_changed: function () {},
            drag_start: function () {},
            drag_move: function () {},
            drag_end: function () {},
            deceleration_start: function () {},
            deceleration_end: function () {},
            tap: function () {}
        },

        set_listener: function (listener)
        {
            this._listener = listener
        },

        enable: function ()
        {
            if (!this._enabled)
            {
                this._enabled = true
                this._start_tracking_touches()
            }
        },

        disable: function ()
        {
            if (this._enabled)
            {
                this._enabled = false
                this._stop_deceleration()
                this._stop_tracking_touches()
            }
        },

        set_max_position: function (x, y)
        {
            this._max_position.x = x
            this._max_position.y = y
        },

        get_max_position: function ()
        {
            return this._max_position
        },

        handleEvent: function (event)
        {
            switch (event.type)
            {
                case this._events.start:
                    this._touchstart(event);
                    break;
                case this._events.move:
                    this._touchmove(event);
                    break;
                case this._events.end:
                    this._touchend(event);
                    break;
                case 'touchcancel':
                    this._touchcancel(event);
                    break;
            }
        },

        _touchstart: function (event)
        {
            if (!this._enabled)
            {
                return
            }
            
            this._stop_deceleration()
            this._start_tracking_drag_touches()
            
            this._last_touch = event.touches ? event.touches[0] : event
            
            this._drag_info = 
            {
                start_position: new Vector(this._position.x, this._position.y),
                start_touch_position: new Vector(this._last_touch.clientX, this._last_touch.clientY),
                start_time: event.timeStamp
            }
            this._drag_info.start_time_position = this._drag_info.start_position
        },

        _touchmove: function (event)
        {
            event.preventDefault()
            event.stopPropagation()

            var touch = event.touches ? event.touches[0] : event,
                diff = this._drag_info.start_touch_position.subtract(new Vector(touch.clientX, touch.clientY))

            if (this._is_dragging)
            {
                var position = this._clamp_position(this._drag_info.start_position.add(diff))
                this.set_position(position)
                
                this._last_event_time = event.timeStamp
                
                if (this._listener.dragmove)
                {
                    this._listener.dragmove(this)   
                }
            }
            else if (Math.max(Math.abs(diff.x), Math.abs(diff.y)) >= this._min_drag_distance)
            {
                this._is_dragging = true

                if (this._listener.dragstart)
                {
                    this._listener.dragstart(this)   
                }
            }
        },

        _touchend: function (event)
        {
            this._stop_tracking_drag_touches()
            
            if (this._is_dragging)
            {
                event.preventDefault()
                event.stopPropagation()
                this._is_dragging = false

                if (event.timeStamp - this._last_event_time <= this._max_drag_watch_time)
                {
                    this._last_event_time = event.timeStamp
                    this._start_deceleration()
                }

                if (this._listener.drag_end)
                {
                    this._listener.drag_end(this)
                }
            }
            else if (this._listener.tap)
            {
                this._listener.tap(this, this._last_touch.clientX, this._last_touch.clientY)
            }
        },

        set_position: function (position)
        {
            this._position = position
            
            if (this._listener.position_changed)
            {
                this._listener.position_changed(this)
            }
        },
        
        get_position: function ()
        {
            return this._position
        },

        _clamp_position: function (position)
        {
            return new Vector(
                Math.min( this._max_position.x >= 0 ? this._max_position.x : position.x,
                    Math.max( this._min_position.x >= 0 ? this._min_position.x : position.x, position.x ) 
                ),
                Math.min( this._max_position.y >= 0 ? this._max_position.y : position.y,
                    Math.max( this._min_position.y >= 0 ? this._min_position.y : position.y, position.y )
                )
            )
        },
        
        _clamp_velocity: function (velocity)
        {
            var v = velocity.copy()
            
            if (Math.abs(v.x > this._max_velocity))
            {
                v.x = this._max_velocity * (v.x < 0 ? -1 : 1)
            }
            
            if (Math.abs(v.y > this._max_velocity))
            {
                v.y = this._max_velocity * (v.y < 0 ? -1 : 1)
            }
            
            return v
        },
        
        _start_tracking_touches: function ()
        {
            window.addEventListener(this._events.start, this, false)
        },
        
        _start_tracking_drag_touches: function ()
        {
            window.addEventListener(this._events.move, this, false)
            window.addEventListener(this._events.end, this, false)
            window.addEventListener('touchcancel', this, false)
        },
        
        _stop_tracking_drag_touches: function ()
        {
            window.removeEventListener(this._events.move, this, false)
            window.removeEventListener(this._events.end, this, false)
            window.removeEventListener('touchcancel', this, false)
        },
        
        _stop_tracking_touches: function ()
        {
            window.removeEventListener(this._events.start, this, false)
            window.removeEventListener(this._events.move, this, false)
            window.removeEventListener(this._events.end, this, false)
            window.removeEventListener('touchcancel', this, false)
        },

        _start_deceleration: function ()
        {
            var distance = this._position.subtract(this._drag_info.start_time_position),
                time = (this._last_event_time - this._drag_info.start_time) / this._acceleration
    
            this._velocity.x = distance.x / time
            this._velocity.y = distance.y / time
            
            var speed = Math.max(
                Math.abs(this._velocity.x),
                Math.abs(this._velocity.y)
            )
            
            if (speed > this._min_velocity_for_deceleration)
            {
                this._velocity = this._clamp_velocity(this._velocity)
                this._is_decelerating = true
                this._deceleration_timer = setTimeout(this._deceleration_step_bound, this._frame_rate)
                this._last_frame = new Date()

                if (this._listener.deceleration_start)
                {
                    this._listener.deceleration_start(this)   
                }
            }
        },

        _stop_deceleration: function ()
        {
            this._is_decelerating = false
            clearTimeout(this._deceleration_timer)
        },

        _deceleration_step: function (is_catch_up)
        {
            if (!this._is_decelerating)
            {
                return
            }

            var now = new Date(),
                elapsed = now - this._last_frame,
                catch_up_steps = is_catch_up ? 0 : (Math.round(elapsed / this._frame_rate) - 1)

            for (var i=0; i<catch_up_steps; i++)
            {
                this._deceleration_step(true)
            }

            var new_position = this._clamp_position(this._position.add(this._velocity))
            this.set_position(new_position)

            this._velocity.x *= this._friction
            this._velocity.y *= this._friction
            
            if (!is_catch_up)
            {
                var speed = Math.max(Math.abs(this._velocity.x), Math.abs(this._velocity.y))
                
                if (speed < this._min_velocity)
                {
                    this._is_decelerating = false
                    return
                }

                this._deceleration_timer = setTimeout(this._deceleration_step_bound, this._frame_rate)
                this._last_frame = now
            }
        }
    }
    TouchSpring._deceleration_step_bound = function ()
    {
        TouchSpring._deceleration_step()
    }

    if (typeof define != "undefined")
    {
        define(function () { return TouchSpring })
    }
})()