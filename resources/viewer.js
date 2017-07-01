var canvas = document.getElementById('viewer-container');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

var vertex = [
	"attribute lowp vec3 aVertexPosition;",
	"attribute lowp vec4 aVertexColor;",

	"uniform sampler2D uSampler;",
	"uniform mat4 uPMVMatrix;",

	"varying vec4 vLightWeighting;",
	"varying vec3 vPosition;",

	"void main(void) {",
        "gl_PointSize = 10.0;",
		"gl_Position = uPMVMatrix * vec4(aVertexPosition, 1.0);",
	        "vLightWeighting = aVertexColor;",
	        "vPosition = aVertexPosition;",
	"}"
].join('');

var fragment = [

	"#extension GL_OES_standard_derivatives : enable\n",
	"precision highp float;",

	"uniform vec3 cameraPosition;",

	"varying vec4 vLightWeighting;",
	"varying vec3 vPosition;",
	"varying vec3 vLightPos;",

	"vec3 normals(vec3 pos) {",
		 "vec3 fdx = dFdx(pos);",
		 "vec3 fdy = dFdy(pos);",
	         "return normalize(cross(fdx, fdy));",
	"}",

	"void main() {",

		"vec3 normal = normals(vPosition);",

		"float d = length(cameraPosition - vPosition);",

		"float att = max(0.6, 1.0 - d*d/4.0);",

		"float lightA = max(0.0, dot(normal, vec3(0.7, -0.7, 1.0)));",
		"float lightB = max(0.0, dot(normal, vec3(0.5, 0.3, -0.1)));",

		"gl_FragColor = vec4 (",
			"att * (",
				"vLightWeighting.rgb * lightB * 0.5 +",
		                "vLightWeighting.rgb * lightA * 0.2 +",
        	        	"vLightWeighting.rgb * 0.62",
	    		"),",
		        "vLightWeighting.w",
		 ");",

	"}"
].join('');


var pMatrix = mat4.create();
var mvMatrix = mat4.create();
var mvpMatrix = mat4.create();
var inverseMvMatrix = mat4.create();

gl = canvas.getContext("webgl");

gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
mat4.perspective(45, canvas.clientWidth/canvas.clientHeight, 0.001, 1000.0, pMatrix);

gl.clearColor(0.0, 0.0, 0.0, 0.0);

gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);
        
gl.disable(gl.STENCIL_TEST);
gl.disable(gl.SCISSOR_TEST);

gl.enable(gl.BLEND);
gl.blendEquation(gl.FUNC_ADD);
gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

gl.getExtension('OES_element_index_uint');
gl.getExtension('OES_standard_derivatives');

var load = function (name, type) {
	var base = name + '.' + type;

        if (window.XMLHttpRequest) {
            xmlhttp = new XMLHttpRequest();
        } else {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }

        xmlhttp.open("GET", base, false);
        xmlhttp.send();

        return xmlhttp.responseText;
}

var getShader = function (type, str) {

        var shader;
        switch (type) {
            case 1:
                shader = gl.createShader(gl.FRAGMENT_SHADER);
                break;
            case 2:
                shader = gl.createShader(gl.VERTEX_SHADER);
        }

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
}


        // Default program
var fragmentShader = getShader(1, fragment);
var vertexShader = getShader(2, vertex);

shaderProgram = gl.createProgram();

gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	alert("Could not initialise shaders");
}

gl.useProgram(shaderProgram);

shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

shaderProgram.colorVertexAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
gl.enableVertexAttribArray(shaderProgram.colorVertexAttribute);

shaderProgram.pPMVatrixUniform = gl.getUniformLocation(shaderProgram, "uPMVMatrix");

shaderProgram.cameraPosition = gl.getUniformLocation(shaderProgram, "cameraPosition");

var scene = [];

var index = scene.push([
	gl.createBuffer(), gl.createBuffer(), gl.createBuffer()
]) - 1;

gl.bindBuffer(gl.ARRAY_BUFFER, scene[index][0]);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
	-1.0, -1.0, 0.0,
	1.0, -1.0, 0.0,
	0.0, 1.0, 0.0
]).buffer, gl.STATIC_DRAW);

gl.bindBuffer(gl.ARRAY_BUFFER, scene[index][1]);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
	1.0, 0.0, 0.0, 1.0,
	0.0, 1.0, 0.0, 1.0, 
	0.0, 0.0, 1.0, 1.0
]).buffer, gl.STATIC_DRAW);

gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, scene[index][2]);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array([
	0, 1, 2
]).buffer, gl.STATIC_DRAW);

scene[index].count = 3;

var isLeftClickPressed = false;
var isRightClickPressed = false;

var target = [0, 0, 0];
var alpha = 0;
var theta = 0;
var offset = 4;

var XANGLE_MIN = -Math.PI / 2;
var XANGLE_MAX = Math.PI / 2;
var LOOK_AROUND_SPEED = 0.01;
var CHANGE_LEVEL_SPEED = 0.00005;
var WHEEL_NORMALIZE = 30;
var WALK_SPEED = 0.00001;
var ORBIT_SPEED = 0.005;
var HOME_OFFSET = 0;
var MIN_MOVE_THRESHOLD = 0.5;
var PAN_DELTA = 0.001;
var MIN_PAN_DELTA = 0.0005;

var PAN_SPEED = function(){
      return 0.01;
};

var ZOOM_DELTA = 0.0001;

var ZOOM_SPEED = function(){
      return 0.01;
};

function calculateMatrixWorld () {

	mvMatrix = mat4.identity(mat4.create());

	mvMatrix = mat4.rotate(mvMatrix, alpha, [mvMatrix[1], mvMatrix[5], mvMatrix[9]]);
        mvMatrix = mat4.rotate(mvMatrix, theta, [mvMatrix[0], mvMatrix[4], mvMatrix[8]]);

        mvMatrix = mat4.translate(mvMatrix, target);

        if (offset != 0) {
        	var vec = [mvMatrix[2], mvMatrix[6], mvMatrix[10]];
                var vLength = Math.sqrt(
	                mvMatrix[2] * mvMatrix[2] +
                        mvMatrix[6] * mvMatrix[6] +
                        mvMatrix[10] * mvMatrix[10]
                );

                vec [0] /= vLength;
                vec [1] /= vLength;
                vec [2] /= vLength;

                vec [0] *= -offset;
                vec [1] *= -offset;
                vec [2] *= -offset;

		mvMatrix = mat4.translate(mvMatrix, vec);

	}


        var pMVPMatrixUniform = [];
        mat4.multiply (pMatrix, mvMatrix, pMVPMatrixUniform);
        mvpMatrix = pMVPMatrixUniform;
        inverseMvMatrix = mat4.inverse(mvMatrix, mat4.create());
}

canvas.oncontextmenu = function () {
    return false;
}

function onMouseMove(e){

	//Orbit
        if (isLeftClickPressed) {
	        alpha -= (lastMousex - e.x) * ORBIT_SPEED;
                theta -= (lastMousey - e.y) * ORBIT_SPEED;

                theta = Math.max(Math.min(theta, XANGLE_MAX), XANGLE_MIN);
                alpha = Math.abs(alpha) > Math.PI2 ? alpha % Math.PI2 : alpha;

        //Pan
	} else if (isRightClickPressed) {
         	var right = vec3.normalize([-1.0, 0.0, 0.0]);
                right = vec3.multiplyScalar(right, (lastMousex - e.x) * PAN_SPEED());

                var up = vec3.normalize([0.0, -1.0, 0.0]);
                up = vec3.multiplyScalar(up, -(lastMousey - e.y) * PAN_SPEED());

                target = vec3.add(target, vec3.add(right, up) );
        }

	calculateMatrixWorld();

	lastMousex = e.x;
        lastMousey = e.y;

}

function onMouseDown(e){
          e.preventDefault();
          e.stopPropagation();

          lastMousex = e.x;
          lastMousey = e.y;

          isLeftClickPressed = e.button === 0;
          isRightClickPressed = e.button === 2;
}

var onMouseUp = function (e) {
        e.preventDefault();
        e.stopPropagation();

        isLeftClickPressed = false;
        isRightClickPressed = false;
}


canvas.addEventListener('wheel', function(e) {
	e.preventDefault();
        e.stopPropagation();

        offset += e.deltaY * ZOOM_SPEED();

        calculateMatrixWorld();
});

canvas.addEventListener('mousemove', onMouseMove);
canvas.addEventListener('mousedown', onMouseDown);
canvas.addEventListener('mouseup', onMouseUp);

canvas.addEventListener('dblclick', function (e) {
    var mousex = e.offsetX, mousey = e.offsetY;

    // get an instance to the current program to restore afterwards
    var previous_program = gl.getParameter(gl.CURRENT_PROGRAM);

    // swap programs
    gl.useProgram(pickerProgram);

    // swap Framebuffer for "behind the scenes" rendering
    gl.bindFramebuffer(gl.FRAMEBUFFER, _self.framebuffer);

    // disable alpha blending. Prevents getting blended colors and improves performance.
    gl.disable(gl.BLEND);

    // Enable sissoring greatly improves performance.
    gl.enable(gl.SCISSOR_TEST);

    // Set values for scissor test
    gl.scissor(mousex, canvas.height - mousey, 1, 1);

    // perform a render swipe to the renderbuffer
    render();

    //_self.printImage();
    // -- PICK
    var readout = new Uint8Array(1 * 1 * 4);
    gl.readPixels(mousex, glModule.canvas.height - mousey, 1, 1, gl.RGBA,gl.UNSIGNED_BYTE,readout);
    var integer_readout = new Float32Array(readout.buffer)[0];

    // attempt to round value
    var fract = integer_readout - Math.floor(integer_readout);
    if(fract > 0.5){
        integer_readout = Math.ceil(integer_readout);
    } else {
        integer_readout = Math.floor(integer_readout);
    }

    var selected_guid;
    // an integer readout = 0 means that the user clicked on a spot in the screen with no rendered geometries.
    if(integer_readout != 0){
        // interpretation of the integer_readout must be substracted 1 to obtain the proper index.
        // check the comments in the picker colors section at the postproc/exporter.js module for more information.
        selected_guid = _context.meta.list[integer_readout - 1.0];
    }

    // -- CLEAR
    // disable scissors
    gl.disable(gl.SCISSOR_TEST);

    // enable back glblend
    gl.enable(gl.BLEND);

    // unbind Framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    //restore previous program if any
    if(previous_program){
        gl.useProgram(previous_program);
    }

});

function render () {

	gl.uniformMatrix4fv(shaderProgram.pPMVatrixUniform, false, mvpMatrix);
	gl.uniform3f(shaderProgram.cameraPosition, inverseMvMatrix[12], inverseMvMatrix[13], inverseMvMatrix[14]);

	gl.clear(gl.DEPTH_BUFFER_BIT);
	gl.clear(gl.COLOR_BUFFER_BIT);
        
	for (var i = 0; i < scene.length; i++) {

            gl.bindBuffer(gl.ARRAY_BUFFER, scene[i][0]);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

	    gl.bindBuffer(gl.ARRAY_BUFFER, scene[i][1]);
            gl.vertexAttribPointer(shaderProgram.colorVertexAttribute, 4, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, scene[i][2]);

            gl.drawElements(gl.TRIANGLES, scene[i].count, gl.UNSIGNED_INT, 0);

            gl.drawElements(gl.POINTS, scene[i].count, gl.UNSIGNED_INT, 0);
	}

	requestAnimationFrame(render);
}

render();


//read3DS("vase_01.3DS");
