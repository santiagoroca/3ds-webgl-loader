function read3DS (filename) {
    var vertices = [];
    var faces = [];

    var requestFaces = new XMLHttpRequest();
    requestFaces.open('GET', filename, true);

    //specify the response type as arraybuffer
    requestFaces.responseType = 'arraybuffer';	

	
    requestFaces.onload = function (msg) {
	var threeDS = new Uint8Array(this.response);

	console.log(threeDS.length);

	var fileLength = threeDS.length;
	for (var i = 0; i < fileLength; i++) {

		var chunk_id = (threeDS[i] | threeDS[++i] << 8);
		var chunk_length = (threeDS[++i] | threeDS[++i] << 8 | threeDS[++i] << 16 | threeDS[++i] << 32);
		console.log (chunk_id);

		switch (chunk_id.toString(16)) {
		
			//Main Chunk	
			case "4d4d": {
				console.log ("Main");
			} break;
	
			//3D Editor Chunk
			case "3d3d": {
				console.log ("Editor");
			} break;

			//File Name
			case "4000": 
			{
				console.log ("File Name");

				var j = 0;

				do {
				    var strChar = (threeDS[++i] | threeDS[++i] << 8).toString(16);

				    console.log (strChar);
				
				} while (strChar != "0" && j++ < 20);
			} break;

			// Triangular Mesh
			case "4100": {
				console.log ("Mesh");
			} break;


			case "4110": {
				console.log ("Vertices");
			
				var sizeOfVertices = (threeDS[++i] | threeDS[++i] << 8);

				console.log (sizeOfVertices, threeDS.length);
	
				for (var j = 0; j < sizeOfVertices; j++) {

					vertices.push(
						threeDS[++i] |
						threeDS[++i] << 8 |
						threeDS[++i] << 16 |
						threeDS[++i] << 32
					);
					
					vertices.push(
						threeDS[++i] |
						threeDS[++i] << 8 |
						threeDS[++i] << 16 |
						threeDS[++i] << 32
					);

					vertices.push(
						threeDS[++i] |
						threeDS[++i] << 8 |
						threeDS[++i] << 16 |
						threeDS[++i] << 32
					);

				}
			} break;

			case "4120": {
				console.log ("Faces");

				var sizeOfFaces = (threeDS[++i] | threeDS[++i] << 8);

				console.log (sizeOfFaces, threeDS.length);

				for (var j = 0; j < sizeOfFaces; j++) {

					faces.push(threeDS[i++] | threeDS[++i] << 8);
					faces.push(threeDS[i++] | threeDS[++i] << 8);
					faces.push(threeDS[i++] | threeDS[++i] << 8);

					//Skips Visible Polygon Flag
					++i; ++i;

				}
			
			} break;

			default: {
				console.log ("Skip", chunk_id, chunk_length);
			    i += (threeDS[++i] | threeDS[++i] << 8) - 6;
			}

		}

	}

	console.log(vertices);
	console.log (faces);
    };

    requestFaces.send();

}
