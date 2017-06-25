function read3DS (filename) {
    var vertices = [];

    var requestFaces = new XMLHttpRequest();
    requestFaces.open('GET', filename, true);

    //specify the response type as arraybuffer
    requestFaces.responseType = 'arraybuffer';	

	
    requestFaces.onload = function (msg) {
	var threeDS = new Uint8Array(this.response);

	var fileLength = threeDS.length;
	for (var i = 0; i < fileLength; i++) {

		var iData = ((threeDS[i] << 8) | threeDS[++i]);

		switch (iData.toString(16)) {
		
			//Main Chunk	
			case "4d4d": {} break;
	
			//3D Editor Chunk
			case "3d3d": {} break;

			//File Name
			case "4000": { 
				console.log("File Name")
			} break;

			case "4100": {
				var sizeOfVertices = ((threeDS[++i] << 8) | threeDS[++i]);
			
				console.log (sizeOfVertices, threeDS.length);
	
				for (var j = 0; j < sizeOfVertices; j++) {

					vertices.push(
						threeDS[++i] << 32 |
						threeDS[++i] << 16 |
						threeDS[++i] << 8 |
						threeDS[++i] 
					);
					
					vertices.push(
						threeDS[++i] << 32 |
						threeDS[++i] << 16 |
						threeDS[++i] << 8 |
						threeDS[++i] 
					);

					vertices.push(
						threeDS[++i] << 32 |
						threeDS[++i] << 16 |
						threeDS[++i] << 8 |
						threeDS[++i] 
					);

				}
			} break;

		}

	}

	console.log(vertices);
    };

    requestFaces.send();

}
