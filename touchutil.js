var jTouch = {
    
    vector : {
        unknown : 0,
        up      : 1,
        down    : 2,
        left    : 4,
        right   : 8
    },
    
    gesture : {
        unknown  : 0,
        swipe    : 1,
        filp     : 2,
        pinchIn  : 4,
        pinchOut : 8
    },

    status : {
        fingers     : 0,
        distance    : 0,
        vector      : 0,
        gesture      : 0,
        doubleTouch : false,
        tripleTouch : false
    },

    calc : {
        touchesInterval : 1,
        filpInterval    : 500,
        filpSize        : 30,
        swipeSize       : 100,
        isLabor         : false,
        isFlip          : false,
        flipBias        : 30,
        fingers         : 0,
        step    : [],
        weight          : 15
    },
    thread : {
      
        flip : null,
        touches : null
    },

    Touches : {},
    Touch : {}
};

jTouch.addTouchListener = function( element, options){
    
    element.addEventListener( "touchstart",
                              function( e){

                                  jTouch.calc.fingers = e.touches.length;
                                  var item = jTouch.Touches.factory( e.touches);
                                  jTouch.calc.step.push( item);
                                  //FlipTimer
                                  jTouch.calc.isFlip = true;
                                  jTouch.thread.flip = setInterval( function(){
                                                    jTouch.calc.isFlip = false;
                                               }, jTouch.calc.filpInterval);

                                  if( options.startCallBack != null){
                                      e.fingers = jTouch.calc.fingers;
                                      e.step = jTouch.calc.step;
                                      
                                      options.startCallBack(e);
                                  }
                              });

    element.addEventListener( "touchmove",
                              function( e){

                                  var item = jTouch.Touches.factory( e.touches);
                                  jTouch.calc.step.push( item);
                                  if( options.moveCallBack != null){
                                      e.fingers = jTouch.calc.fingers;
                                      e.step = jTouch.calc.step;

                                      options.moveCallBack(e);
                                  }
                                  
                              });

    element.addEventListener( "touchend",
                              function( e){
                                  //DoubleTouch, TripleTouch
                                  if( jTouch.calc.isLabor){
                                      if( jTouch.status.doubleTouch){
                                          jTouch.status.tripleTouch = true;
                                      }
                                      jTouch.status.doubleTouch = true;
                                  }


                                  //Labor Status
                                  clearTimeout( jTouch.thread.touches);
                                  jTouch.calc.isLabor = true;
                                  jTouch.thread.touches = setInterval( jTouch.calc.touchesInterval, function(){
                                                   jTouch.calc.isLabor = false; 
                                               });        
                                  
                                  var gesture_ = jTouch.getGesture();
                                  
                                  clearTimeout( jTouch.thread.filp);
                                  

                                  if( options.callBack != null){

                                      e.fingers = jTouch.calc.fingers;
                                      e.step = jTouch.calc.step;
                                      e.tGesture = gesture_.gesture;
                                      e.tVecotr = gesture_.vector;
                                      e.doubleTouch = jTouch.status.doubleTouch;
                                      e.tripleTouch = jTouch.status.tripleTouch;
                                      
                                      options.callBack(e);
                                  }

                                  //clear
                                  jTouch.calc.step = [];
                                  jTouch.calc.isFlip = false;
                              });
};

jTouch.getGesture = function(){
    var sums = jTouch.calc.step.getVectorSum(),
        x = sums[0].x,
        y = sums[0].y;
      
    
    //is pinch
    if(jTouch.calc.fingers == 2 && jTouch.calc.step.length > 8){
        var state = jTouch.calcPinch( jTouch.calc.step);
        if( state !== jTouch.gesture.unknown){
            return {
                gesture : state
            };
        }
    }

    //is Filp? 
    if( jTouch.calc.isFlip){
        var gesture_ = { gesture : jTouch.gesture.filp};
        if( x < -jTouch.calc.filpSize){
            gesture_.vector = jTouch.vector.left;
        }else if( x > jTouch.calc.filpSize){
            gesture_.vector = jTouch.vector.right;
        }else if( y > jTouch.calc.filpSize){
            gesture_.vector = jTouch.vector.down;
        }else if( y < -jTouch.calc.filpSize){
            gesture_.vector = jTouch.vector.up;
        }else{
            gesture_.vector = jTouch.vector.unknown;
        }
        
        return gesture_;
    }

    //is Swipe?
    if( x < -jTouch.calc.swipeSize){
       return {
           vector : jTouch.vector.left ,
           gesture : jTouch.gesture.swipe
       };
    }else if( x > jTouch.calc.swipeSize){
       return {
           vector : jTouch.vector.right ,
           gesture : jTouch.gesture.swipe
       };
    }else if( y > jTouch.calc.swipeize){
       return {
           vector : jTouch.vector.down ,
           gesture : jTouch.gesture.swipe
       }; 
    }else if( y < -jTouch.calc.swipeSize){
       return {
           vector : jTouch.vector.up ,
           gesture : jTouch.gesture.swipe
       }; 
   }

    return {
        vector : jTouch.vector.unknown,
        gesture : jTouch.gesture.unknown
    };
};

jTouch.Touches.factory = function( touches){
    
    var ary = [],
        i;
    for( i = 0; i < touches.length; i++){
        
        ary.push( jTouch.Touch.factory( touches[i].pageX, touches[i].pageY));
    }

    return ary;
};

jTouch.Touch.factory = function( x, y){
    
    return { x: x, y: y};
};

jTouch.calcPinch = function( ary){
    
    var copy = [],
        len, i;
    for( i = 0; i < ary.length; i+=4){
        if( ary[i].length == 2){
            
            len = Math.sqrt(
                (ary[i][0].x - ary[i][1].x) * (ary[i][0].x - ary[i][1].x) +
                (ary[i][0].y - ary[i][1].y) * (ary[i][0].y - ary[i][1].y)    
            );
        
            copy.push( len);
        }

    }
    
    var state = jTouch.pinchVector( copy);
    
    if( state !== jTouch.gesture.unknown){
        
        if( Math.abs( ary[1][0].x - ary[ary.length-1][0].x) > copy[copy.length-1] ||
        Math.abs( ary[1][0].y - ary[ary.length-1][0].y) > copy[copy.length-1]){
            state = jTouch.gesture.unknown;
        }

    }
    return state;
};

jTouch.pinchVector = function( ary){
    
    var state;
    for( var i = 0; i < ary.length-1; i++){
        if( ary[i] < ary[i+1]){
            if( i > 0 && state === jTouch.gesture.pinchIn){
                return jTouch.gesture.unknown;
            }
            state = jTouch.gesture.pinchOut;
            
        }else if( ary[i] > ary[i+1]){

            if( i > 0 && state === jTouch.gesture.pinchOut){
                return jTouch.gesture.unknown;
            }
            state = jTouch.gesture.pinchIn;
            
        }
    }

    return state;
};

Array.prototype.getVectorSum = function(){
    
    var start = this[0],
        last = this[this.length - 1],
        sums = [];

    for( var i = 0; i < start.length; i++){
        sums[i] = { x: 0, y: 0};
        sums[i].x = last[i].x - start[i].x;
        sums[i].y = last[i].y - start[i].y;
    }

    return sums;
};
