export default {
	triangle: {
		vertexPositions: [{x:-100,y:0}, {x:100,y:0}, {x:0,y:100}],
		vertexSuccessorEdges: [2,0,1],
		
		halfEdgeSuccessorVertices: [1,2,0,2,1,0],
		halfEdgeSuccessorEdges: [1,2,0,4,5,3],
		halfEdgePartners: [5,4,3,2,1,0],
		halfEdgeFaces: [1,1,1,0,0,0],
		
		faceStartEdges: [0,3],
	},
	segment: {
		vertexPositions: [{x:0,y:0}, {x:0,y:0}],
		vertexSuccessorEdges: [0, 1],
		
		halfEdgeSuccessorVertices: [0,1,1,0],
		halfEdgeSuccessorEdges: [1,0,3,2],
		halfEdgePartners: [2,3,0,1],
		halfEdgeFaces: [1,1,0,0],
		
		faceStartEdges: [1,0],
	},
	loop: {
		vertexPositions: [{x:0,y:0}],
		vertexSuccessorEdges: [0],
		
		halfEdgeSuccessorVertices: [0,0],
		halfEdgeSuccessorEdges: [0,1],
		halfEdgePartners: [1,0],
		halfEdgeFaces: [1,0],
		
		faceStartEdges: [1,0],
	},
	quad: {"vertexPositions":[{"x":-100,"y":100},{"x":100,"y":-100},{"x":100,"y":100},{"x":-100,"y":-100}],"vertexSuccessorEdges":[2,7,1,5],"halfEdgeSuccessorVertices":[3,2,0,2,1,3,0,1],"halfEdgeSuccessorEdges":[7,2,0,4,5,6,3,1],"halfEdgePartners":[6,4,3,2,1,7,0,5],"halfEdgeFaces":[1,1,1,0,0,0,0,1],"faceStartEdges":[0,3]},
	quad2: {"vertexPositions":[{"x":-100,"y":100},{"x":100,"y":-100},{"x":100,"y":100},{"x":-100,"y":-100}],"vertexSuccessorEdges":[2,7,1,5],"halfEdgeSuccessorVertices":[3,2,0,2,1,3,0,1,2,3],"halfEdgeSuccessorEdges":[7,2,0,9,5,8,3,1,4,6],"halfEdgePartners":[6,4,3,2,1,7,0,5,9,8],"halfEdgeFaces":[1,1,1,0,0,0,0,1,2,1],"faceStartEdges":[0,3,8]},
	house: {"vertexPositions":[{"x":-100,"y":100},{"x":100,"y":-100},{"x":100,"y":100},{"x":-100,"y":-100},{"x":0,"y":-200}],"vertexSuccessorEdges":[2,10,1,11,7],"halfEdgeSuccessorVertices":[3,2,0,2,1,4,0,4,2,3,1,3,1,3],"halfEdgeSuccessorEdges":[7,2,0,9,13,11,3,10,4,6,1,12,5,8],"halfEdgePartners":[6,4,3,2,1,10,0,11,9,8,5,7,13,12],"halfEdgeFaces":[1,1,1,0,0,0,0,1,2,1,1,0,3,2],"faceStartEdges":[0,3,4,12]},
	house2: {"vertexPositions":[{"x":-100,"y":100},{"x":100,"y":-100},{"x":100,"y":100},{"x":-100,"y":-100},{"x":0,"y":-200},{"x":0,"y":0}],"vertexSuccessorEdges":[2,10,1,11,7,9],"halfEdgeSuccessorVertices":[3,2,0,2,1,4,0,4,5,5,1,3,1,3,3,2,5,0,1,5],"halfEdgeSuccessorEdges":[7,2,0,9,19,11,16,10,18,17,1,12,5,8,6,4,14,3,13,15],"halfEdgePartners":[6,4,3,2,1,10,0,11,14,15,5,7,13,12,8,9,17,16,19,18],"halfEdgeFaces":[1,1,1,0,0,0,0,1,2,1,1,0,3,2,1,2,4,1,5,2],"faceStartEdges":[0,9,4,12,16,18]}
}