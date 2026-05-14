
/*!
 * Winwheel.js
 * Copyright 2011-2023 Douglas McKechie
 * www.dougtesting.net
 *
 * This code is released under the MIT license.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in

 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
class Winwheel {
    constructor(options, drawWheel)
    {
        // The default options for the wheel, used if member of options is not specified.
        let defaultOptions = {
            'canvasId'          : 'canvas',     // Id of the canvas which the wheel is to draw on.
            'centerX'           : null,         // X position of the center of the wheel. The default of null centers the wheel in the canvas.
            'centerY'           : null,         // Y position of the center of the wheel. The default of null centers the wheel in the canvas.
            'outerRadius'       : null,         // The radius of the outside of the wheel. If left as null it will be set to the radius from the center of the canvas to the edge.
            'innerRadius'       : 0,            // Normally 0. Allows the creation of rings / doughnuts if set to value > 0. Should not exceed outerRadius.
            'numSegments'       : 1,            // The number of segments. Need at least one to draw.
            'drawMode'          : 'code',       // The draw mode, can be 'code' or 'image'. Default is code which means segments are drawn using canvas arc() function.
            'rotationAngle'     : 0,            // The angle of rotation of the wheel - 0 is 12 o'clock position.
            'textFontSize'      : 20,           // Size of the text.
            'textFillStyle'     : 'black',      // The colour of the text.
            'textStrokeStyle'   : null,         // The colour of the text stroke.
            'textLineWidth'     : 1,            // The line width of the text stroke.
            'textOrientation'   : 'horizontal', // The orientation of the text, can be horizontal, vertical, or curved.
            'textAlignment'     : 'center',     // The alignment of the text, can be inner, outer, or center.
            'textDirection'     : 'normal',     // The direction of the text, can be normal or reversed.
            'textMargin'        : null,         // Margin of the text from the inside or outside of the wheel.
            'textFontFamily'    : 'Arial',      // The font to use for the text.
            'textFontWeight'    : 'bold',       // The font weight to use for the text.
            'textOutline'       : false,        // True if text should be outlined. See also textStrokeStyle.
            'textVAlign'        : 'top',        // Vertical alignment of the text.
            'segments'          : [],           // An array of segments, each segment is an object.
            'animation'         : null,         // An object defining the animation of the wheel.
            'pins'              : null,         // An object defining the pins on the wheel.
            'pointerAngle'      : 0,            // The angle of the pointer.
            'wheelImage'        : null,         // An image to use for the wheel.
            'imageOverlay'      : false,        // If to draw the segments over the wheel image.
            'drawText'          : true,         // If to draw the text on the segments.
            'pointerGuide'      : null,         // An object defining the pointer guide.
            'responsive'        : false,        // If the wheel is responsive.
            'scaleFactor'       : 1,            // The scale factor of the wheel.
            'imageDirection'    : 'N'           // The direction of the image.
        };

        // For each option if it is not specified then use the default.
        for (let key in defaultOptions) {
            if ((options != null) && (typeof(options[key]) !== 'undefined')) {
                this[key] = options[key];
            } else {
                this[key] = defaultOptions[key];
            }
        }

        // If the drawMode is image change some defaults.
        if (this.drawMode == 'image') {
            // Remove black fillstyle if not specified in case the image has transparent areas.
            if (options['fillStyle'] === undefined) this.fillStyle = null;
            if (options['strokeStyle'] === undefined) this.strokeStyle = 'red';
            if (options['lineWidth'] === undefined) this.lineWidth = 1;
            if (options['drawText'] === undefined) this.drawText = false;
        }

        // Adivable to have segments that are objects so can hold properties like colour and text.
        // If the segments specified is just a simple array of strings then convert to object representation.
        if (this.segments) {
            for (let x = 0; x < this.segments.length; x ++) {
                if (typeof this.segments[x] !== 'object') {
                    this.segments[x] = {'text' : this.segments[x]};
                }
            }
        }

        // The animation object can be null, if so create a new one to hold the properties.
        if (this.animation == null) {
            this.animation = new Animation();
        } else {
            this.animation = new Animation(this.animation);
        }

        // The pins object can be null, if so create a new one to hold the properties.
        if (this.pins != null) {
            this.pins = new Pins(this.pins);
        }

        // Check if the canvas object exists on the page.
        this.canvas = document.getElementById(this.canvasId);

        if (this.canvas) {
            // If the centerX and Y have not been specified in the options then default to center of the canvas
            // and make the outerRadius half of the canvas width - this means the wheel will fill the canvas.
            if (this.centerX == null) this.centerX = this.canvas.width / 2;
            if (this.centerY == null) this.centerY = this.canvas.height / 2;
            if (this.outerRadius == null) {
                // Use smallest of the width or height of the canvas as the basis for the radius.
                if (this.canvas.width < this.canvas.height) {
                    this.outerRadius = (this.canvas.width / 2) - this.lineWidth;
                } else {
                    this.outerRadius = (this.canvas.height / 2) - this.lineWidth;
                }
            }

            // Get the canvas context.
            this.ctx = this.canvas.getContext('2d');
        } else {
            this.canvas = null;
            this.ctx = null;
        }

        // The pointer guide can be null, if so create a new one to hold the properties.
        if (this.pointerGuide != null) {
            this.pointerGuide = new PointerGuide(this.pointerGuide);
        }

        // On window resize if responsive is true then redraw the wheel.
        if (this.responsive) {
            this.winwheelToDrawDuringAnimation = this;
            this._originalCanvasWidth = this.canvas.width;
            this._originalCanvasHeight = this.canvas.height;
            this._responsiveScaleHeight = this.canvas.height / this._originalCanvasHeight;
            this._responsiveScaleWidth = this.canvas.width / this._originalCanvasWidth;
            this._responsiveResize = this._responsiveResize.bind(this); // Bind this to the resize function.
            window.addEventListener("resize", this._responsiveResize);
        }

        // If the wheel is to be drawn taking in to account the current rotationAngle then need to clear the canvas of the pre-drawn wheel.
        // The draw method is passed a clearCanvas parameter which is true by default and defaults to this.
        if (drawWheel != false) {
            this.draw(true);
        } else if (this.drawMode == 'image') {
            // If not drawing the wheel and this is an image based wheel then need to load the image.
            this.loadImage();
        }
    }

    _responsiveResize()
    {
        // To do this properly, we need to stop any animation that is running as the animation calculations are based on the original wheel parameters.
        this.stopAnimation(false);

        // Reset the rotation angle to the animation end angle.
        this.rotationAngle = this.animation.endAngle;

        this.canvas.width = this._originalCanvasWidth * this._getResponsiveScale();
        this.canvas.height = this._originalCanvasHeight * this._getResponsiveScale();

        // The scale factor is used to scale the drawing of the wheel, fonts etc.
        this.scaleFactor = this._getResponsiveScale();

        // We also need to recalculate the center of the wheel.
        if (this.centerX == null) {
            this.centerX = this.canvas.width / 2;
        }

        if (this.centerY == null) {
            this.centerY = this.canvas.height / 2;
        }

        // The outer radius will need recalculating.
        if (this.outerRadius == null) {
            if (this.canvas.width < this.canvas.height) {
                this.outerRadius = (this.canvas.width / 2) - this.lineWidth;
            } else {
                this.outerRadius = (this.canvas.height / 2) - this.lineWidth;
            }
        }

        // Redraw the wheel.
        this.draw();
    }

    _getResponsiveScale()
    {
        let widthFactor = this.canvas.parentElement.offsetWidth / this._originalCanvasWidth;
        let heightFactor = this.canvas.parentElement.offsetHeight / this._originalCanvasHeight;

        return Math.min(widthFactor, heightFactor);
    }

    // ====================================================================================================================
    // This function adds a segment to the wheel.
    // ====================================================================================================================
    addSegment(segmentToAdd, position)
    {
        // In case the segment is just a string, convert to object.
        if (typeof segmentToAdd !== 'object') {
            segmentToAdd = {'text' : segmentToAdd};
        }

        if (position !== undefined) {
            this.segments.splice(position, 0, segmentToAdd);
        } else {
            this.segments.push(segmentToAdd);
        }

        // The number of segments will have changed so need to update numSegments.
        this.updateSegmentSizes();

        // Redraw the wheel.
        this.draw();
    }

    // ====================================================================================================================
    // This function deletes the specified segment from the wheel.
    // ====================================================================================================================
    deleteSegment(position)
    {
        // There is issue if you try to delete the segment that the wheel is currently animated to so...
        // The best solution is to stop the animation before deleting the segment.
        if (this.animation.inProgress == true) {
            this.stopAnimation(false);
        }

        if (position !== undefined) {
            this.segments.splice(position, 1);
        }

        // The number of segments will have changed so need to update numSegments.
        this.updateSegmentSizes();

        // Redraw the wheel.
        this.draw();
    }

    // ====================================================================================================================
    // This function can be used to set the stops of the animation and then begin the animation.
    // ====================================================================================================================
    startAnimation(prizeImage)
    {
        if (this.animation) {
            // Call the start function of the animation object.
            this.animation.start(this);

            // If a prize image is specified then load it in to the wheel.
            if (typeof prizeImage !== 'undefined') {
                // If the image is not already loaded then create a new Image object and load it.
                // We need to do this otherwise the image will not have time to load before the wheel is drawn.
                let newImage = new Image();
                newImage.src = prizeImage.src;

                // When the image has loaded, set it as the prizeImage and redraw the wheel.
                newImage.onload = () => {
                    this.prizeImage = newImage;
                    this.draw();
                }
            } else {
                this.draw();
            }
        }
    }

    // ====================================================================================================================
    // This function stops the animation. The reset could be used torotor to the same position as before the animation.
    // ====================================================================================================================
    stopAnimation(canCallback)
    {
        if (this.animation) {
            this.animation.stop(canCallback);
        }
    }

    // ====================================================================================================================
    // This function pauses the animation.
    // ====================================================================================================================
    pauseAnimation()
    {
        if (this.animation) {
            this.animation.pause();
        }
    }

    // ====================================================================================================================
    // This function resumes the animation.
    // ====================================================================================================================
    resumeAnimation()
    {
        if (this.animation) {
            this.animation.resume();
        }
    }

    // ====================================================================================================================
    // This function updates the size of the segments to make them all the same size.
    // ====================================================================================================================
    updateSegmentSizes()
    {
        // If the wheel has segments.
        if (this.segments) {
            // Set the numSegments property to the number of segments.
            this.numSegments = this.segments.length;

            // Set the angle of each segment to 360 / numSegments.
            let angle = 360 / this.numSegments;

            // Go through all the segments and update the size of each.
            for (let i = 0; i < this.numSegments; i ++) {
                this.segments[i].size = angle;
            }
        }
    }

    // ====================================================================================================================
    // This function clears the canvas, used to reset the wheel.
    // ====================================================================================================================
    clearCanvas()
    {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // ====================================================================================================================
    // This function draws the wheel on the canvas.
    // ====================================================================================================================
    draw(clearCanvas)
    {
        // If have context, proceed with drawing.
        if (this.ctx) {
            // Clear the canvas, unless told not to.
            if (typeof(clearCanvas) !== 'undefined') {
                if (clearCanvas == true) {
                    this.clearCanvas();
                }
            } else {
                this.clearCanvas();
            }

            if (this.drawMode == 'image') {
                // If the wheel is to be drawn as an image then call function to do this.
                this.drawWheelImage();

                // If the segments are to be drawn on top of the image then call the draw segments function.
                if (this.imageOverlay == true) {
                    this.drawSegments();
                }
            } else {
                // The default is to draw the segments using code.
                this.drawSegments();
            }

            // If the wheel has pins, draw them.
            if (this.pins) {
                // If the pins are to be visible then draw them.
                if (this.pins.visible) {
                    this.drawPins();
                }
            }

            // If a pointer guide is defined, draw it.
            if (this.pointerGuide) {
                this.drawPointerGuide();
            }

            // If a prize image is defined, draw it.
            if (this.prizeImage) {
                this.drawPrizeImage();
            }
        }
    }

    // ====================================================================================================================
    // This function draws the prize image on the canvas.
    // ====================================================================================================================
    drawPrizeImage()
    {
        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.rotate(this.degToRad(this.rotationAngle));
        this.ctx.translate(-this.centerX, -this.centerY);
        this.ctx.drawImage(this.prizeImage, this.centerX - (this.prizeImage.width / 2), this.centerY - this.innerRadius - (this.prizeImage.height / 2));
        this.ctx.restore();
    }

    // ====================================================================================================================
    // This function draws the pins on the wheel.
    // ====================================================================================================================
    drawPins()
    {
        let pinOuterRadius = (this.pins.outerRadius) ? this.pins.outerRadius : this.outerRadius;

        // The pins are drawn on a circle with radius of this.pins.outerRadius.
        if (this.pins) {
            let pinAngle = 360 / this.pins.number;

            for (let i=1; i<=this.pins.number; i++) {
                this.ctx.save();

                // Set the stroke style and line width.
                this.ctx.strokeStyle = this.pins.strokeStyle;
                this.ctx.lineWidth = this.pins.lineWidth;
                this.ctx.fillStyle = this.pins.fillStyle;

                // Move the context to the center of the wheel.
                this.ctx.translate(this.centerX, this.centerY);

                // Rotate the context to the angle of the pin.
                this.ctx.rotate(this.degToRad(i * pinAngle + this.rotationAngle));

                // Move the context to the radius of the pin.
                this.ctx.translate(-this.centerX, -this.centerY);

                // Draw the pin.
                this.ctx.beginPath();
                this.ctx.arc(this.centerX, this.centerY - pinOuterRadius, this.pins.size, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.stroke();

                this.ctx.restore();
            }
        }
    }

    // ====================================================================================================================
    // This function draws the pointer guide.
    // ====================================================================================================================
    drawPointerGuide()
    {
        if (this.ctx) {
            // Create a triangular path for the pointer.
            this.ctx.save();

            // Set the stroke style and line width.
            this.ctx.strokeStyle = this.pointerGuide.strokeStyle;
            this.ctx.lineWidth = this.pointerGuide.lineWidth;
            this.ctx.fillStyle = this.pointerGuide.fillStyle;

            // Move the context to the center of the wheel.
            this.ctx.translate(this.centerX, this.centerY);

            // Rotate the context to the angle of the pointer.
            this.ctx.rotate(this.degToRad(this.pointerAngle));

            // Move the context to the radius of the pointer.
            this.ctx.translate(-this.centerX, -this.centerY);

            // Draw the pointer guide.
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY - this.outerRadius + 5);
            this.ctx.lineTo(this.centerX + 10, this.centerY - this.outerRadius + 5 + 10);
            this.ctx.lineTo(this.centerX - 10, this.centerY - this.outerRadius + 5 + 10);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.restore();
        }
    }

    // ====================================================================================================================
    // This loads the image for the wheel.
    // ====================================================================================================================
    loadImage(onload)
    {
        if (this.wheelImage) {
            let image = new Image();
            image.src = this.wheelImage;
            image.onload = () => {
                this.wheelImage = image;

                if (onload) {
                    onload(this);
                }
            }
        }
    }

    // ====================================================================================================================
    // This function draws the wheel image on the canvas.
    // ====================================================================================================================
    drawWheelImage()
    {
        // If we have the image object, draw it on the canvas.
        if (this.wheelImage != null) {
            // Save the context so we can restore it after we have rotated it.
            this.ctx.save();

            // Translate to the center of the canvas.
            this.ctx.translate(this.centerX, this.centerY);

            // Rotate the canvas by the rotation angle.
            this.ctx.rotate(this.degToRad(this.rotationAngle));

            // Translate back to the top left.
            this.ctx.translate(-this.centerX, -this.centerY);

            // Draw the image in the center of the canvas.
            // Also take in to account the scale factor.
            this.ctx.drawImage(this.wheelImage,
                this.centerX - (this.wheelImage.width / 2),
                this.centerY - (this.wheelImage.height / 2),
                this.wheelImage.width * this.scaleFactor,
                this.wheelImage.height * this.scaleFactor
            );

            // Restore the context.
            this.ctx.restore();
        }
    }

    // ====================================================================================================================
    // This function draws the segments of the wheel.
    // ====================================================================================================================
    drawSegments()
    {
        // If we have a context, proceed.
        if (this.ctx) {
            // Go through all the segments and draw them.
            for (let i=0; i<this.numSegments; i++) {
                // Get the segment object.
                let seg = this.segments[i];
                let fillStyle;
                let lineWidth;
                let strokeStyle;

                // Set the variables to the specified values of the segment, or the wheel if not specified.
                if (seg.fillStyle !== undefined) fillStyle = seg.fillStyle;
                else fillStyle = this.fillStyle;

                this.ctx.fillStyle = fillStyle;

                if (seg.lineWidth !== undefined) lineWidth = seg.lineWidth;
                else lineWidth = this.lineWidth;

                this.ctx.lineWidth = lineWidth;

                if (seg.strokeStyle !== undefined) strokeStyle = seg.strokeStyle;
                else strokeStyle = this.strokeStyle;

                this.ctx.strokeStyle = strokeStyle;

                // If the stroke style is not specified then it will not be drawn, so to be able to draw a line between the segments
                // need to give a stroke style. The default is black.
                if (this.strokeStyle != null) {
                    // Begin a path as the segment is drawn as an arc.
                    this.ctx.beginPath();

                    // If the wheel has a lineWidth then we need to draw an arc for the outside of the wheel, then one for the inside.
                    if (this.lineWidth > 0) {
                        // The lines are drawn from the center of the line, so to avoid the lines sticking out from the wheel
                        // need to move the start and end angles of the arcs by a small amount.
                        // The amount is the lineWidth / the radius of the wheel.
                        let a = this.getAngle(i);
                        let s = a.start;
                        let e = a.end;

                        this.ctx.arc(this.centerX, this.centerY, this.outerRadius, s, e, false);

                        if (this.innerRadius > 0) {
                            this.ctx.arc(this.centerX, this.centerY, this.innerRadius, e, s, true);
                        }
                    }

                    // Stroke the path.
                    this.ctx.stroke();
                }

                // If the fill style is not null then fill the segment.
                if (fillStyle != null) {
                    // Begin a path as the segment is drawn as an arc.
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.centerX, this.centerY);
                    let a = this.getAngle(i);
                    let s = a.start;
                    let e = a.end;
                    this.ctx.arc(this.centerX, this.centerY, this.outerRadius, s, e, false);

                    if (this.innerRadius > 0) {
                        this.ctx.arc(this.centerX, this.centerY, this.innerRadius, e, s, true);
                    } else {
                        this.ctx.lineTo(this.centerX, this.centerY);
                    }

                    // Fill the path.
                    this.ctx.fill();
                }
            }

            // If the drawText property is true then call the function to draw the text.
            if (this.drawText == true) {
                this.drawSegmentText();
            }
        }
    }

    // ====================================================================================================================
    // This function draws the text on the segments.
    // ====================================================================================================================
    drawSegmentText()
    {
        // If we have a context, proceed.
        if (this.ctx) {
            let i;

            // Go through all the segments and draw the text for each.
            for (i=0; i<this.numSegments; i++) {
                // Get the segment object.
                let seg = this.segments[i];

                // If the segment has text to be drawn.
                if (seg.text) {
                    // Set the font size and font family.
                    let fontSize = seg.textFontSize ? seg.textFontSize : this.textFontSize;
                    let fontFamily = seg.textFontFamily ? seg.textFontFamily : this.textFontFamily;
                    let fontWeight = seg.textFontWeight ? seg.textFontWeight : this.textFontWeight;
                    this.ctx.font = fontWeight + ' ' + (fontSize * this.scaleFactor) + 'px ' + fontFamily;

                    // Set the fill style and stroke style.
                    let fillStyle = seg.textFillStyle ? seg.textFillStyle : this.textFillStyle;
                    let strokeStyle = seg.textStrokeStyle ? seg.textStrokeStyle : this.textStrokeStyle;
                    let lineWidth = seg.textLineWidth ? seg.textLineWidth : this.textLineWidth;

                    // Set the text alignment.
                    let textAlignment = seg.textAlignment ? seg.textAlignment : this.textAlignment;

                    // Set the text orientation.
                    let textOrientation = seg.textOrientation ? seg.textOrientation : this.textOrientation;

                    // Set the text direction.
                    let textDirection = seg.textDirection ? seg.textDirection : this.textDirection;

                    // Set the text margin.
                    let textMargin = seg.textMargin ? seg.textMargin : this.textMargin;

                    // Set the vertical alignment.
                    let textVAlign = seg.textVAlign ? seg.textVAlign : this.textVAlign;

                    // If the fill style is not null then fill the text.
                    if (fillStyle != null) {
                        this.ctx.fillStyle = fillStyle;
                    }

                    // If the stroke style is not null then stroke the text.
                    if (strokeStyle != null) {
                        this.ctx.strokeStyle = strokeStyle;
                        this.ctx.lineWidth = (lineWidth * this.scaleFactor);
                    }

                    // Get the angle of the segment.
                    let a = this.getAngle(i);
                    let s = a.start;
                    let e = a.end;

                    // Calculate the angle of the center of the segment.
                    let angle = s + ((e - s) / 2);

                    // We need to rotate the canvas to the angle of the segment.
                    this.ctx.save();
                    this.ctx.translate(this.centerX, this.centerY);
                    this.ctx.rotate(angle);
                    this.ctx.translate(-this.centerX, -this.centerY);

                    // If the text orientation is vertical then rotate the canvas 90 degrees.
                    if (textOrientation == 'vertical') {
                        this.ctx.save();
                        this.ctx.translate(this.centerX, this.centerY);
                        this.ctx.rotate(this.degToRad(90));
                        this.ctx.translate(-this.centerX, -this.centerY);
                    } else if (textOrientation == 'curved') {
                        this.ctx.textAlign = 'left';
                    }

                    // If the text alignment is inner then we need to align the text to the right.
                    if (textAlignment == 'inner') {
                        if (textOrientation == 'curved') {
                            this.ctx.textAlign = 'right';
                        } else {
                            this.ctx.textAlign = 'right';
                        }
                    } else if (textAlignment == 'outer') {
                        if (textOrientation == 'curved') {
                            this.ctx.textAlign = 'left';
                        } else {
                            this.ctx.textAlign = 'left';
                        }
                    } else { // Center
                        this.ctx.textAlign = 'center';
                    }

                    // Get the radius of the text.
                    let textRadius = 0;
                    if (textAlignment == 'inner') {
                        textRadius = this.innerRadius + textMargin;
                    } else if (textAlignment == 'outer') {
                        textRadius = this.outerRadius - textMargin;
                    } else {
                        textRadius = this.innerRadius + (this.outerRadius - this.innerRadius) / 2;
                    }

                    // Get the text to be drawn.
                    let text = seg.text;

                    // If the text orientation is curved then we need to draw the text along the arc.
                    if (textOrientation == 'curved') {
                        let textAngle;
                        if (textDirection == 'reversed') {
                            textAngle = this.ctx.measureText(text).width / (textRadius * Math.PI / 180);
                            this.ctx.save();
                            this.ctx.rotate(this.degToRad(textAngle / 2));
                            for (let j = 0; j < text.length; j++) {
                                this.ctx.save();
                                this.ctx.rotate(j * this.degToRad(textAngle / text.length));
                                this.ctx.fillText(text[j], this.centerX + textRadius, this.centerY);
                                this.ctx.restore();
                            }
                            this.ctx.restore();
                        } else {
                            textAngle = this.ctx.measureText(text).width / (textRadius * Math.PI / 180);
                            this.ctx.save();
                            this.ctx.rotate(this.degToRad(-textAngle / 2));
                            for (let j = 0; j < text.length; j++) {
                                this.ctx.save();
                                this.ctx.rotate(j * this.degToRad(textAngle / text.length));
                                this.ctx.fillText(text[j], this.centerX + textRadius, this.centerY);
                                this.ctx.restore();
                            }
                            this.ctx.restore();
                        }
                    } else {
                        // The y position of the text.
                        let y = 0;

                        if (textVAlign == 'top') {
                            if (textOrientation == 'vertical') {
                                y = this.centerY - textRadius;
                            } else {
                                y = this.centerY - textRadius;
                            }
                        } else if (textVAlign == 'middle') {
                            if (textOrientation == 'vertical') {
                                y = this.centerY;
                            } else {
                                y = this.centerY;
                            }
                        } else if (textVAlign == 'bottom') {
                            if (textOrientation == 'vertical') {
                                y = this.centerY + textRadius;
                            } else {
                                y = this.centerY + textRadius;
                            }
                        }

                        // The x position of the text.
                        let x = 0;

                        if (textAlignment == 'inner') {
                            if (textOrientation == 'vertical') {
                                x = this.centerX + textRadius;
                            } else {
                                x = this.centerX + textRadius;
                            }
                        } else if (textAlignment == 'outer') {
                            if (textOrientation == 'vertical') {
                                x = this.centerX - textRadius;
                            } else {
                                x = this.centerX - textRadius;
                            }
                        } else { // Center
                            x = this.centerX;
                        }

                        // If the text orientation is vertical then swap the x and y.
                        if (textOrientation == 'vertical') {
                            let temp = x;
                            x = y;
                            y = temp;
                        }

                        // Set the text baseline.
                        this.ctx.textBaseline = textVAlign;

                        // Fill the text.
                        if (fillStyle != null) {
                            this.ctx.fillText(text, x, y);
                        }

                        // Stroke the text.
                        if (strokeStyle != null) {
                            this.ctx.strokeText(text, x, y);
                        }
                    }

                    // Restore the canvas.
                    this.ctx.restore();

                    // If the text orientation is vertical then restore the canvas.
                    if (textOrientation == 'vertical') {
                        this.ctx.restore();
                    }
                }
            }
        }
    }

    // ====================================================================================================================
    // This function returns the angle of the segment in radians.
    // ====================================================================================================================
    getAngle(i)
    {
        // The angle of the segment is the rotation angle of the wheel, plus the start angle of the segment,
        // which is the sum of the sizes of the segments before it.
        let angle = this.rotationAngle;

        for (let j=0; j<i; j++) {
            angle += this.segments[j].size;
        }

        let startAngle = this.degToRad(angle);
        let endAngle = this.degToRad(angle + this.segments[i].size);

        return {'start' : startAngle, 'end' : endAngle};
    }

    // ====================================================================================================================
    // This function calculates the prize for the wheel.
    // ====================================================================================================================
    getIndicatedSegment()
    {
        // The prize is the segment that the pointer is pointing to.
        // The pointer angle is the angle of the pointer from the 12 o'clock position.
        // We need to know which segment the pointer is in.

        // The angle of the pointer from the 12 o'clock position is this.pointerAngle.
        // The rotation angle of the wheel is this.rotationAngle.
        // The total angle is the pointer angle plus the rotation angle.
        // We need to normalise this to be between 0 and 360.
        let totalAngle = this.pointerAngle + this.rotationAngle;
        let normalizedAngle = totalAngle % 360;

        // The segments are drawn from the 12 o'clock position clockwise.
        // The angle of the start of the first segment is 0.
        // The angle of the end of the first segment is the size of the first segment.
        // The angle of the start of the second segment is the size of the first segment.
        // The angle of the end of the second segment is the size of the first segment plus the size of the second segment.
        // etc.

        // So we need to find which segment the normalized angle is in.
        let i;
        let angle = 0;
        for (i=0; i<this.numSegments; i++) {
            angle += this.segments[i].size;

            if (normalizedAngle <= angle) {
                return this.segments[i];
            }
        }

        return this.segments[0];
    }

    // ====================================================================================================================
    // This function returns the number of the indicated segment.
    // ====================================================================================================================
    getIndicatedSegmentNumber()
    {
        // The prize is the segment that the pointer is pointing to.
        // The pointer angle is the angle of the pointer from the 12 o'clock position.
        // We need to know which segment the pointer is in.

        // The angle of the pointer from the 12 o'clock position is this.pointerAngle.
        // The rotation angle of the wheel is this.rotationAngle.
        // The total angle is the pointer angle plus the rotation angle.
        // We need to normalise this to be between 0 and 360.
        let totalAngle = this.pointerAngle + this.rotationAngle;
        let normalizedAngle = totalAngle % 360;

        // The segments are drawn from the 12 o'clock position clockwise.
        // The angle of the start of the first segment is 0.
        // The angle of the end of the first segment is the size of the first segment.
        // The angle of the start of the second segment is the size of the first segment.
        // The angle of the end of the second segment is the size of the first segment plus the size of the second segment.
        // etc.

        // So we need to find which segment the normalized angle is in.
        let i;
        let angle = 0;
        for (i=0; i<this.numSegments; i++) {
            angle += this.segments[i].size;

            if (normalizedAngle <= angle) {
                return i + 1;
            }
        }

        return 1;
    }

    // ====================================================================================================================
    // This function returns a random angle for the wheel to spin to.
    // ====================================================================================================================
    getRandomAngle()
    {
        return Math.random() * 360;
    }

    // ====================================================================================================================
    // This function returns the angle of the specified segment.
    // ====================================================================================================================
    getSegmentAngle(segmentNumber)
    {
        // The angle of the segment is the start angle of the segment plus half the size of the segment.
        let angle = 0;
        for (let i=0; i<segmentNumber-1; i++) {
            angle += this.segments[i].size;
        }

        angle += this.segments[segmentNumber-1].size / 2;

        return angle;
    }

    // ====================================================================================================================
    // This function returns the angle of the specified segment in radians.
    // ====================================================================================================================
    getSegmentAngleRad(segmentNumber)
    {
        return this.degToRad(this.getSegmentAngle(segmentNumber));
    }

    // ====================================================================================================================
    // This function converts an angle in degrees to radians.
    // ====================================================================================================================
    degToRad(d)
    {
        return d * (Math.PI / 180);
    }

    // ====================================================================================================================
    // This function converts an angle in radians to degrees.
    // ====================================================================================================================
    radToDeg(r)
    {
        return r * (180 / Math.PI);
    }

    // ====================================================================================================================
    // This function sets the rotation angle of the wheel and redraws it.
    // ====================================================================================================================
    setRotationAngle(angle)
    {
        this.rotationAngle = angle;
        this.draw();
    }

    // ====================================================================================================================
    // This function resets the wheel to the 12 o'clock position.
    // ====================================================================================================================
    reset()
    {
        this.stopAnimation(false);
        this.rotationAngle = 0;
        this.draw();
    }

    // ====================================================================================================================
    // This function changes the prize of the specified segment.
    // ====================================================================================================================
    changePrize(segmentNumber, prize)
    {
        this.segments[segmentNumber-1].text = prize;
        this.draw();
    }

    // ====================================================================================================================
    // This function can be used to set the stops of the animation and then begin the animation.
    // ====================================================================================================================
    spin()
    {
        if (this.animation) {
            // Set the animation to spin to a random angle.
            this.animation.spins = this.animation.spins ? this.animation.spins : 8;
            this.animation.stopAngle = this.getRandomAngle();
            this.animation.start(this);
        }
    }

    // ====================================================================================================================
    // This function can be used to set the stops of the animation and then begin the animation.
    // ====================================================================================================================
    spinTo(segmentNumber)
    {
        if (this.animation) {
            // Set the animation to spin to the specified segment.
            this.animation.spins = this.animation.spins ? this.animation.spins : 8;
            this.animation.stopAngle = this.getSegmentAngle(segmentNumber);
            this.animation.start(this);
        }
    }

    // ====================================================================================================================
    // This function can be used to set the stops of the animation and then begin the animation.
    // ====================================================================================================================
    spinToAndStop(segmentNumber)
    {
        if (this.animation) {
            // Set the animation to spin to the specified segment and then stop.
            this.animation.spins = this.animation.spins ? this.animation.spins : 8;
            this.animation.stopAngle = this.getSegmentAngle(segmentNumber);
            this.animation.start(this);
            this.animation.stop(true);
        }
    }

    // ====================================================================================================================
    // This is a helper function to fire a callback at the specified time.
    // ====================================================================================================================
    callback(callback, time)
    {
        setTimeout(callback, time);
    }
}

class Animation {
    constructor(options)
    {
        // The default options for the animation.
        let defaultOptions = {
            'type'              : 'spinToStop', // The type of animation, can be spinToStop, spinOngoing, or none.
            'direction'         : 'clockwise',  // The direction of the animation, can be clockwise or anti-clockwise.
            'duration'          : 10,           // The duration of the animation in seconds.
            'spins'             : 8,            // The number of spins.
            'stopAngle'         : null,         // The angle where the wheel is to stop.
            'startAngle'        : 0,            // The angle where the wheel is to start.
            'endAngle'          : null,         // The angle where the wheel is to end.
            'yoyo'              : false,        // If the animation is to go back and forth.
            'repeat'            : 0,            // The number of times to repeat the animation.
            'easing'            : 'power.out(3)', // The easing function to use.
            'onStart'           : null,         // The function to call when the animation starts.
            'onStep'            : null,         // The function to call on each step of the animation.
            'onComplete'        : null,         // The function to call when the animation completes.
            'onRepeat'          : null,         // The function to call when the animation repeats.
            'onReverseComplete' : null          // The function to call when the animation reverse completes.
        };

        // For each option if it is not specified then use the default.
        for (let key in defaultOptions) {
            if ((options != null) && (typeof(options[key]) !== 'undefined')) {
                this[key] = options[key];
            } else {
                this[key] = defaultOptions[key];
            }
        }

        // The animation is not in progress to begin with.
        this.inProgress = false;
    }

    // ====================================================================================================================
    // This function starts the animation.
    // ====================================================================================================================
    start(wheel)
    {
        // If the animation is not already in progress.
        if (this.inProgress == false) {
            // The animation is now in progress.
            this.inProgress = true;

            // If the start angle is not specified then set it to the current rotation angle.
            if (this.startAngle == null) {
                this.startAngle = wheel.rotationAngle;
            }

            // If the stop angle is not specified then set it to a random angle.
            if (this.stopAngle == null) {
                this.stopAngle = wheel.getRandomAngle();
            }

            // If the direction is clockwise then the start angle needs to be less than the stop angle.
            if (this.direction == 'clockwise') {
                if (this.startAngle > this.stopAngle) {
                    this.startAngle -= 360;
                }
            } else {
                if (this.startAngle < this.stopAngle) {
                    this.startAngle += 360;
                }
            }

            // The end angle is the start angle plus the number of spins times 360.
            if (this.direction == 'clockwise') {
                this.endAngle = this.startAngle + (this.spins * 360);
            } else {
                this.endAngle = this.startAngle - (this.spins * 360);
            }

            // If the easing function is specified then get the easing function.
            if (this.easing) {
                this.easing = this.getEasing(this.easing);
            }

            // If there is a callback function to be called on start then call it.
            if (this.onStart) {
                this.onStart(wheel);
            }

            // The start time of the animation is the current time.
            this.startTime = new Date().getTime();

            // The animation loop.
            this.loop(wheel);
        }
    }

    // ====================================================================================================================
    // This function stops the animation.
    // ====================================================================================================================
    stop(canCallback)
    {
        // The animation is no longer in progress.
        this.inProgress = false;

        // If a callback is allowed and there is a callback function to be called on complete then call it.
        if (canCallback != false) {
            if (this.onComplete) {
                this.onComplete(wheel);
            }
        }
    }

    // ====================================================================================================================
    // This function pauses the animation.
    // ====================================================================================================================
    pause()
    {
        // If the animation is in progress then pause it.
        if (this.inProgress == true) {
            // The animation is no longer in progress.
            this.inProgress = false;

            // The time when the animation was paused.
            this.pauseTime = new Date().getTime();
        }
    }

    // ====================================================================================================================
    // This function resumes the animation.
    // ====================================================================================================================
    resume()
    {
        // If the animation was paused then resume it.
        if (this.inProgress == false && this.pauseTime != null) {
            // The animation is now in progress.
            this.inProgress = true;

            // The start time of the animation is the current time minus the time the animation was paused for.
            this.startTime += (new Date().getTime() - this.pauseTime);

            // The loop function will continue the animation from where it was paused.
            this.loop(wheel);
        }
    }

    // ====================================================================================================================
    // This function is the animation loop.
    // ====================================================================================================================
    loop(wheel)
    {
        // If the animation is in progress.
        if (this.inProgress == true) {
            // The current time.
            let currentTime = new Date().getTime();

            // The time that has elapsed since the animation started.
            let elapsedTime = currentTime - this.startTime;

            // The progress of the animation as a percentage.
            let progress = elapsedTime / (this.duration * 1000);

            // If the animation has not completed.
            if (progress < 1) {
                // The angle of the wheel.
                let angle = this.startAngle + ((this.endAngle - this.startAngle) * this.easing(progress));

                // Set the rotation angle of the wheel.
                wheel.setRotationAngle(angle);

                // If there is a callback function to be called on step then call it.
                if (this.onStep) {
                    this.onStep(wheel);
                }

                // Request the next frame of the animation.
                requestAnimationFrame(() => { this.loop(wheel); });
            } else {
                // The animation has completed.
                this.inProgress = false;

                // Set the rotation angle of the wheel to the stop angle.
                wheel.setRotationAngle(this.stopAngle);

                // If there is a callback function to be called on complete then call it.
                if (this.onComplete) {
                    this.onComplete(wheel);
                }
            }
        }
    }

    // ====================================================================================================================
    // This function returns the easing function.
    // ====================================================================================================================
    getEasing(easing)
    {
        // The easing functions.
        let easings = {
            'linear' : function (t) { return t; },
            'easeInQuad' : function (t) { return t*t; },
            'easeOutQuad' : function (t) { return t*(2-t); },
            'easeInOutQuad' : function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t; },
            'easeInCubic' : function (t) { return t*t*t; },
            'easeOutCubic' : function (t) { return (--t)*t*t+1; },
            'easeInOutCubic' : function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; },
            'easeInQuart' : function (t) { return t*t*t*t; },
            'easeOutQuart' : function (t) { return 1-(--t)*t*t*t; },
            'easeInOutQuart' : function (t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t; },
            'easeInQuint' : function (t) { return t*t*t*t*t; },
            'easeOutQuint' : function (t) { return 1+(--t)*t*t*t*t; },
            'easeInOutQuint' : function (t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t; }
        };

        // If the easing function is a string then return the easing function.
        if (typeof easing == 'string') {
            return easings[easing];
        } else {
            return easing;
        }
    }
}

class Pins {
    constructor(options)
    {
        // The default options for the pins.
        let defaultOptions = {
            'visible'           : false,        // If the pins are visible.
            'number'            : 36,           // The number of pins.
            'outerRadius'       : 5,            // The outer radius of the pins.
            'fillStyle'         : 'grey',       // The fill style of the pins.
            'strokeStyle'       : 'black',      // The stroke style of the pins.
            'lineWidth'         : 1,            // The line width of the pins.
            'margin'            : 5             // The margin of the pins from the edge of the wheel.
        };

        // For each option if it is not specified then use the default.
        for (let key in defaultOptions) {
            if ((options != null) && (typeof(options[key]) !== 'undefined')) {
                this[key] = options[key];
            } else {
                this[key] = defaultOptions[key];
            }
        }
    }
}

class PointerGuide {
    constructor(options)
    {
        // The default options for the pointer guide.
        let defaultOptions = {
            'display'           : false,        // If the pointer guide is to be displayed.
            'strokeStyle'       : 'black',      // The stroke style of the pointer guide.
            'lineWidth'         : 1,            // The line width of the pointer guide.
            'fillStyle'         : 'white'       // The fill style of the pointer guide.
        };

        // For each option if it is not specified then use the default.
        for (let key in defaultOptions) {
            if ((options != null) && (typeof(options[key]) !== 'undefined')) {
                this[key] = options[key];
            } else {
                this[key] = defaultOptions[key];
            }
        }
    }
}
