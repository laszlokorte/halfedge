<script>
	let showLabels = false
	let showVertices = true
	let showEdges = true
	let showFaces = true
	let showControls = true
	let showTraversals = false

	function createLoop() {
		return {
			vertexPositions: [{x:0,y:0}],
			vertexSuccessorEdges: [0],
			
			halfEdgeSuccessorVertices: [0,0],
			halfEdgeSuccessorEdges: [0,1],
			halfEdgePartners: [1,0],
			halfEdgeFaces: [1,0],
			
			faceStartEdges: [1,0],
		}
	}

	function createSegment() {
		return {
			vertexPositions: [{x:0,y:0}, {x:0,y:0}],
			vertexSuccessorEdges: [0, 1],
			
			halfEdgeSuccessorVertices: [0,1,1,0],
			halfEdgeSuccessorEdges: [1,0,3,2],
			halfEdgePartners: [2,3,0,1],
			halfEdgeFaces: [1,1,0,0],
			
			faceStartEdges: [1,0],
		}
	}
	
	function createTriangle() {
		return {
			vertexPositions: [{x:-1,y:0}, {x:1,y:0}, {x:0,y:1}],
			vertexSuccessorEdges: [2,0,1],
			
			halfEdgeSuccessorVertices: [1,2,0,2,1,0],
			halfEdgeSuccessorEdges: [1,2,0,4,5,3],
			halfEdgePartners: [5,4,3,2,1,0],
			halfEdgeFaces: [1,1,1,0,0,0],
			
			faceStartEdges: [0,3],
		}
	}
	
	function interp(t, a, b) {
		return a + t * (b - a)
	}
	
	function interpPoint(t, a, b) {
		return {
			x: interp(t, a.x, b.x),
			y: interp(t, a.y, b.y),
		}
	}
	
	function interpPointOffset(t, offset, a, b) {
		const x = interp(t, a.x, b.x)
		const y = interp(t, a.y, b.y)
		
		const dx = b.x - a.x
		const dy = b.y - a.y
		
		const length = Math.sqrt(dx*dx + dy*dy)
		const dxn = length ? dx/length : 0
		const dyn = length ? dy/length : 0
		
		return {
			x: x + dyn * offset,
			y: y - dxn * offset,
			angle: Math.atan2(dy, dx)
		}
	}
	
	function interpHalfEdge(t, edge, geometry) {
		const backEdge = geometry.halfEdgePartners[edge]
		const v1 = geometry.halfEdgeSuccessorVertices[edge]
		const v2 = geometry.halfEdgeSuccessorVertices[backEdge]
		
		return interpPoint(t, geometry.vertexPositions[v1], geometry.vertexPositions[v2])
	}
	
	function interpHalfEdgeOffset(t, offset, edge, geometry) {
		const backEdge = geometry.halfEdgePartners[edge]
		const v1 = geometry.halfEdgeSuccessorVertices[edge]
		const v2 = geometry.halfEdgeSuccessorVertices[backEdge]
		
		return interpPointOffset(t, offset, geometry.vertexPositions[v1], geometry.vertexPositions[v2])
	}
	
	function isTriangleFace(face, geometry) {
		const startEdge = geometry.faceStartEdges[face]
		const nextEdge = geometry.halfEdgeSuccessorEdges[startEdge]
		const nextNextEdge = geometry.halfEdgeSuccessorEdges[nextEdge]
		const nextNextNextEdge = geometry.halfEdgeSuccessorEdges[nextNextEdge]
		
		return startEdge === nextNextNextEdge
	}

	function canTriangulateFace(face, geometry) {
		const startEdge = geometry.faceStartEdges[face]
		const nextEdge = geometry.halfEdgeSuccessorEdges[startEdge]
		const nextNextEdge = geometry.halfEdgeSuccessorEdges[nextEdge]
		const nextNextNextEdge = geometry.halfEdgeSuccessorEdges[nextNextEdge]
		
		return (startEdge !== nextEdge && 
			startEdge !== nextNextEdge && 
			startEdge !== nextNextNextEdge)
	}

	function triangulateFace(face, geometry) {
		const startEdge = geometry.faceStartEdges[face]
		const nextEdge = geometry.halfEdgeSuccessorEdges[startEdge]
		const nextNextEdge = geometry.halfEdgeSuccessorEdges[nextEdge]
		const nextNextNextEdge = geometry.halfEdgeSuccessorEdges[nextNextEdge]
		if(!canTriangulateFace(face, geometry)) {
			return geometry
		}
		
		const newFace = geometry.faceStartEdges.length
		const newEdge = geometry.halfEdgeSuccessorEdges.length
		const newBackEdge = geometry.halfEdgeSuccessorEdges.length + 1
		
		const v1 = geometry.halfEdgeSuccessorVertices[startEdge]
		const v2 = geometry.halfEdgeSuccessorVertices[nextNextEdge]
		
		return {
			vertexPositions: geometry.vertexPositions,
			vertexSuccessorEdges: geometry.vertexSuccessorEdges,
			
			halfEdgeSuccessorVertices: [...geometry.halfEdgeSuccessorVertices, v1, v2],
			halfEdgeSuccessorEdges: [...geometry.halfEdgeSuccessorEdges.map((o,e) => {
				if(e===nextNextEdge) {
					 return newEdge
				} else if(e===startEdge) {
					return newBackEdge
			  } else {
					return o
				}
			}), nextEdge, nextNextNextEdge],
			halfEdgePartners: [...geometry.halfEdgePartners, newBackEdge, newEdge],
			halfEdgeFaces: [...geometry.halfEdgeFaces, newFace, face],
			
			faceStartEdges: [...geometry.faceStartEdges, newEdge],
		}
	}
	
	function splitEdge(edge, geometry) {
		const oldSuccessorEdge = geometry.halfEdgeSuccessorEdges[edge]
		const backEdge = geometry.halfEdgePartners[edge]
		const oldBackSuccessorEdge = geometry.halfEdgeSuccessorEdges[backEdge]
		const v1 = geometry.halfEdgeSuccessorVertices[edge]
		const v2 = geometry.halfEdgeSuccessorVertices[backEdge]
		
		const newVertexIdx = geometry.vertexPositions.length
		const newVertexPosition = interpHalfEdge(0.5, edge, geometry)
		
		const newEdge = geometry.halfEdgeSuccessorEdges.length
		const newBackEdge = geometry.halfEdgeSuccessorEdges.length + 1
		
		return {
			vertexPositions: [...geometry.vertexPositions, newVertexPosition],
			vertexSuccessorEdges: [...geometry.vertexSuccessorEdges.map((o, v) => {
				if(v===v1 && o === edge) {
					return newEdge
				} else if(v===v2 && o === backEdge) {
					return newBackEdge
				} else {
					return o
				}
			}), edge],
			
			halfEdgeSuccessorVertices: [...geometry.halfEdgeSuccessorVertices.map((s,e) => {
				if(e===edge) {
					return newVertexIdx
				} else if(e===backEdge) {
					return newVertexIdx
				} else {
					return s
				}
			}), v1, v2],
			
			halfEdgeSuccessorEdges: [...geometry.halfEdgeSuccessorEdges.map((s,e) => {
				if(e===edge) {
					return newEdge
				} else if(e===backEdge) {
					return newBackEdge
				} else {
					return s
				}
			}), oldSuccessorEdge, oldBackSuccessorEdge],
			
			halfEdgePartners: [...geometry.halfEdgePartners.map((s,e) => {
				if(e===edge) {
					return newBackEdge
				} else if(e===backEdge) {
					return newEdge
				} else {
					return s
				}
			}), backEdge, edge],
			
			halfEdgeFaces: [...geometry.halfEdgeFaces, geometry.halfEdgeFaces[edge], geometry.halfEdgeFaces[backEdge]],
			
			faceStartEdges: [...geometry.faceStartEdges],
		}
	}
	
	let geometry = createTriangle() 
	
	
	function doSplit(edge) {
		geometry = splitEdge(edge, geometry)
	}
	
	function doTriangulate(face) {
		geometry = triangulateFace(face, geometry)
	}
	
	function faceMeanPosition(geometry, faceId) {
		let xSum = 0
		let ySum = 0
		let count = 0
		
		const startEdge = geometry.faceStartEdges[faceId]
		let currentEdge = geometry.faceStartEdges[faceId]
		do {
			xSum += geometry.vertexPositions[geometry.halfEdgeSuccessorVertices[currentEdge]].x
			ySum += geometry.vertexPositions[geometry.halfEdgeSuccessorVertices[currentEdge]].y
			count += 1
			currentEdge = geometry.halfEdgeSuccessorEdges[currentEdge]
		} while(currentEdge != startEdge)
		
		return {x:xSum/count,y:ySum/count}
	}
	
	function faceVertices(geometry, faceId) {
		const result = []
		
		const startEdge = geometry.faceStartEdges[faceId]
		let currentEdge = geometry.faceStartEdges[faceId]
		do {
			result.push(geometry.vertexPositions[geometry.halfEdgeSuccessorVertices[currentEdge]])
			currentEdge = geometry.halfEdgeSuccessorEdges[currentEdge]
		} while(currentEdge != startEdge)
			
		return result
	}
	
	function clickSplit(evt) {
		doSplit(1*evt.currentTarget.getAttribute('data-edge'))
		selectedVertex = geometry.vertexPositions.length - 1
	}
	
	function clickTriangulate(evt) {
		doTriangulate(1*evt.currentTarget.getAttribute('data-face'))
	}
	
	let selectedVertex = null
	function dragStart(evt) {
		selectedVertex = 1*evt.currentTarget.getAttribute('data-vertex')
	}
	
	function dragStop() {
		selectedVertex = null
	}
	
	function dragUpdate(evt) {
		if(selectedVertex !== null) {
			const pos = screenToLocal(evt.clientX, evt.clientY)
			if(pos) {
				geometry.vertexPositions[selectedVertex] = clampPoint({x:-1.8,y:-1.8}, {x:1.8,y:1.8}, pos)
			}
		}
	}

	function clampPoint(min, max, point) {
		return {
			x: clamp(min.x, max.x, point.x),
			y: clamp(min.y, max.y, point.y),
		}
	}

	function clamp(min, max, v) {
		return Math.max(min, Math.min(max, v))
	}
	
	let svg = null
	$: p = svg ? svg.createSVGPoint() : null
	
	function screenToLocal(x,y) {
		if(!svg) return null
		p.x = x
		p.y = y
		return p.matrixTransform(svg.getScreenCTM().inverse())
	}
</script>

<style>

	svg {
		max-width: 60rem;
		width: 100%;
		height: auto;
		display: block;
	}

	.hidden {
		display: none;
	}
	
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	
	dl {
		display: grid;
		grid-template-columns: max-content max-content;
		gap: 1em;
	}
	
	dd {
		margin: 0;
	}


	article {
		max-width: 60em;
		margin:  auto;
	}

	.layout {
		display: flex;
		gap:  1em;
	}

	fieldset {
		min-width: 15em;
	}

	svg {
		border:  1px solid gray;
	}
</style>

<svelte:window on:mousemove={dragUpdate} on:mouseup={dragStop} />
<article>
	<h1>Halfedge Data Structure (HDS)</h1>
	
	<p>
		An Halfedge Data Structure (HDS) is a data structure designed to represent geometric mesh data. It consists of a set of vertices (pink), faces (light blue) and edges (dark green) that are linked a particular way. Think of a multidimensional cyclic linked list.
	</p>

	<p>
		Below you can insert vertices by clicking the orange dots in the middle of the edges. Vertices (pink) can be dragged around. Faces that are made up of more than three edges are marked by a little triangle. Clicking the triangle splits the corresponding face in two.
	</p>

	<div class="layout">
	<header>

		<fieldset>
			<legend>Options</legend>

			<button on:click={() => {geometry = createTriangle()}}>
				Clear</button>

			<ul>
				<li><label><input type="checkbox" bind:checked={showLabels} /> showLabels</label></li>
				<li><label><input type="checkbox" bind:checked={showVertices} /> showVertices</label></li>
				<li><label><input type="checkbox" bind:checked={showEdges} /> showEdges</label></li>
				<li><label><input type="checkbox" bind:checked={showFaces} /> showFaces</label></li>
				<li><label><input type="checkbox" bind:checked={showControls} /> showControls</label></li>
				<li><label><input type="checkbox" bind:checked={showTraversals} /> showTraversals</label></li>
			</ul>
		</fieldset>



	</header>


	<svg bind:this={svg} viewBox="-2 -2 4 4" stroke-width="2" font-size="0.1" text-anchor="middle" dominant-baseline="middle">
		<defs>
			<marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
				<path d="M0,0 L0,6 L9,3 z" fill="GoldenRod" />
			</marker>
		</defs>

		<g class:hidden={!showFaces}>
		{#each geometry.faceStartEdges as startEdge, faceId}
			{@const pos = faceMeanPosition(geometry, faceId)}
			{@const halfEdge = geometry.faceStartEdges[faceId]}
			{@const edgeCenter = interpHalfEdgeOffset(0.5, 0, halfEdge, geometry)}
			{#if faceId > 0}
				<polyline points={faceVertices(geometry, faceId).flatMap(({x,y}) => [x,y])} fill="SkyBlue" opacity="0.2"></polyline>
				<text class:hidden={!showLabels} x={pos.x} y={pos.y} font-size="0.07">F {faceId}</text>
				<line class:hidden={!showTraversals} x1={pos.x} y1={pos.y + 0.05} x2={edgeCenter.x} y2={edgeCenter.y} stroke="GoldenRod" stroke-width="0.01" marker-end="url(#arrow)"></line>
				 
				<path class:hidden={!showControls || !canTriangulateFace(faceId, geometry)} d="M{pos.x}  {pos.y + 0.09} l0.025 0l-0.025 -0.05l-0.025 0.05" fill="brown"></path>
			{/if}
		{/each}
		</g>
		
		<g class:hidden={!showEdges}>
			{#each geometry.halfEdgeSuccessorEdges as _,currentEdge}
				{@const backEdgeEdge = geometry.halfEdgePartners[currentEdge]}
				{@const vertexA = geometry.halfEdgeSuccessorVertices[backEdgeEdge]}
				{@const vertexB = geometry.halfEdgeSuccessorVertices[currentEdge]}
				{@const posA = interpHalfEdgeOffset(0, 0, currentEdge, geometry)}
				{@const posB = interpHalfEdgeOffset(1, 0, currentEdge, geometry)}
				{@const centerPoint = interpHalfEdgeOffset(0.5, 0, currentEdge, geometry)}
				{@const labelPos = interpHalfEdgeOffset(0.5, 0, currentEdge, geometry)}
				<line x1={posA.x} y1={posA.y} x2={posB.x} y2={posB.y} stroke="Teal" vector-effect="non-scaling-stroke"></line>
				<text transform="rotate({((vertexA > vertexB ? 0 : -180) + labelPos.angle * 180 / Math.PI + 360 +90) % 180 - 90}, {labelPos.x}, {labelPos.y})" class:hidden={!showLabels} x={labelPos.x} y={labelPos.y + (vertexA > vertexB ? 0.08 : -0.08)} font-size="0.07">e{currentEdge} [v{vertexA} to v{vertexB}] (o: {geometry.halfEdgePartners[currentEdge]}, f: {geometry.halfEdgePartners[currentEdge]})</text>

				<circle class:hidden={!showControls} cx={centerPoint.x} cy={centerPoint.y} r="0.02" fill="Tomato"></circle>
			{/each}
		</g>
		
		
		<g class:hidden={!showVertices}>
		{#each geometry.vertexPositions as {x,y}, vidx}
			{@const edgeCenter = interpHalfEdgeOffset(0.5, 0, geometry.vertexSuccessorEdges[vidx], geometry)}
			
			<circle cx={x} cy={y} r="0.03" fill="DeepPink">
			<title>{vidx}</title>
			</circle>
			<text class:hidden={!showLabels} x={x} y={y+(0.1*Math.sign(y||-1))}>
			v{vidx} (e{geometry.vertexSuccessorEdges[vidx]})
			</text>
			
				<line class:hidden={!showTraversals} x1={x} y1={y} x2={edgeCenter.x} y2={edgeCenter.y} stroke="GoldenRod" stroke-width="0.01" marker-end="url(#arrow)"></line>

		{/each}
		</g>
		
		<g class:hidden={!showControls}>
		{#each geometry.halfEdgeSuccessorEdges as _,currentEdge}
			{@const centerPoint = interpHalfEdgeOffset(0.5, 0, currentEdge, geometry)}

			<circle cx={centerPoint.x} cy={centerPoint.y} r="0.15" fill="none" pointer-events="fill" cursor="copy" on:mousedown={clickSplit} data-edge={currentEdge}>
				<title>Add Vertex</title>
			</circle>

		{/each}
		</g>
		
		<g class:hidden={!showControls || !showVertices}>
		{#each geometry.vertexPositions as {x,y}, vidx}
			<circle stroke="none" cx={x} cy={y} r="0.1" fill="none" pointer-events="fill" cursor="move" on:mousedown={dragStart} data-vertex={vidx}>
				<title>Drag Vertex</title>
			</circle>
		{/each}
		</g>
		
		<g class:hidden={!showControls || !showFaces}>
		{#each geometry.faceStartEdges as startEdge, faceId}
			{@const pos = faceMeanPosition(geometry, faceId)}
			{#if faceId > 0 && canTriangulateFace(faceId, geometry)}
					<circle class:hidden={!showControls} cx={pos.x} cy={pos.y + 0.05} r="0.04" fill="none" pointer-events="fill" cursor="pointer" on:click={clickTriangulate} data-face={faceId}>
						<title>Triangulate Face</title>
					</circle>
			{/if}
		{/each}
		</g>

	
	</svg>
	</div>
</article>