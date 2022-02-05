<script>
	import samples from './meshes.js'

	let showLabels = false
	let showVertices = true
	let showEdges = true
	let showFaces = true
	let showControls = true
	let showTraversals = false
	let showRotators = true

	let selected = null
	
	function loadMesh(name) {
		if(samples[name]) {	
			selected = null	
			geometry = samples[name]
		}
	}

	const formatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })

	function isVertexSelected(s, v) {
		return s === 'V'+v
	}

	function isEdgeSelected(s, e) {
		return s === 'E'+e
	}

	function isFaceSelected(s, f) {
		return s === 'F'+f
	}

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
			vertexPositions: [{x:-100,y:0}, {x:100,y:0}, {x:0,y:100}],
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

	function rotateFace(face, geometry) {
		return {
			vertexPositions: geometry.vertexPositions,
			vertexSuccessorEdges: geometry.vertexSuccessorEdges,
			halfEdgeSuccessorVertices: geometry.halfEdgeSuccessorVertices,
			halfEdgeSuccessorEdges: geometry.halfEdgeSuccessorEdges,
			halfEdgePartners: geometry.halfEdgePartners,
			halfEdgeFaces: geometry.halfEdgeFaces,
			faceStartEdges: geometry.faceStartEdges.map((o, i) => {
				if(i===face) {
					return geometry.halfEdgeSuccessorEdges[o]
				} else {
					return o
				}
			}),
		}
	}



	function rotateVertex(vertex, geometry) {
		return {
			vertexPositions: geometry.vertexPositions,
			vertexSuccessorEdges: geometry.vertexSuccessorEdges.map((o, i) => {
				if(i===vertex) {
					return geometry.halfEdgePartners[geometry.halfEdgeSuccessorEdges[o]]
				} else {
					return o
				}
			}),
			halfEdgeSuccessorVertices: geometry.halfEdgeSuccessorVertices,
			halfEdgeSuccessorEdges: geometry.halfEdgeSuccessorEdges,
			halfEdgePartners: geometry.halfEdgePartners,
			halfEdgeFaces: geometry.halfEdgeFaces,
			faceStartEdges: geometry.faceStartEdges,
		}
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
	
	function doRotateFace(face) {
		geometry = rotateFace(face, geometry)
	}
	
	function doRotateVertex(vertex) {
		geometry = rotateVertex(vertex, geometry)
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
		if(evt.type === 'mousedown') {
			grabbedVertex = geometry.vertexPositions.length - 1
		}
		selected = 'V' + (geometry.vertexPositions.length - 1)
	}
	
	function clickTriangulate(evt) {
		doTriangulate(1*evt.currentTarget.getAttribute('data-face'))
	}
	
	function clickRotateFace(evt) {
		doRotateFace(1*evt.currentTarget.getAttribute('data-face'))
	}
	
	function clickRotateVertex(evt) {
		doRotateVertex(1*evt.currentTarget.getAttribute('data-vertex'))
	}
	
	let grabbedVertex = null
	function dragStart(evt) {
		const vertexId = 1*evt.currentTarget.getAttribute('data-vertex')
		grabbedVertex = vertexId
	}
	
	function dragStop() {
		grabbedVertex = null
	}
	
	function dragUpdate(evt) {
		if(grabbedVertex !== null) {
			const pos = screenToLocal(evt.clientX, evt.clientY)
			if(pos) {
				geometry = {
					...geometry,
					vertexPositions: geometry.vertexPositions.map((o,v) => {
						if(v===grabbedVertex) {
							return clampPoint({x:clampBox[0],y:clampBox[1]}, {x:clampBox[2]+clampBox[0],y:clampBox[3]+clampBox[1]}, pos)
						} else {
							return o
						}
					})
				}
			}
		}
	}

	function clickSelectElement(evt) {
		if(evt.currentTarget.hasAttribute('data-vertex')) {
			selected = 'V'+evt.currentTarget.getAttribute('data-vertex')
		} else if(evt.currentTarget.hasAttribute('data-edge')) {
			selected = 'E'+evt.currentTarget.getAttribute('data-edge')
		} else if(evt.currentTarget.hasAttribute('data-face')) {
			selected = 'F'+evt.currentTarget.getAttribute('data-face')
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
	$: clampBox = svg ? svg.getAttribute('viewBox').split(' ').map((v) => parseFloat(v)) : [0,0,0,0]
	
	function screenToLocal(x,y) {
		if(!svg) return null
		p.x = x
		p.y = y
		return p.matrixTransform(svg.getScreenCTM().inverse())
	}
</script>

<style>

	button {
		padding: 0.2em 0.5em;
		font: inherit;
	}

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
		grid-template-columns: max-content auto;
		gap: 0.5em 1em;
		margin: 0;
	}

	dd {
		margin: 0;
	}


	article {
		max-width: 60em;
		margin: 1em auto 5em;
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

	svg [cursor]:hover,
	svg [cursor].active {
		fill: #0004;
	}

	h3 {
		margin: 0;
	}

	select {
		width: 100%;
		box-sizing: border-box;
		accent-color: orange;
	}

	circle.selected {
		stroke: orange;
		pointer-events: none;
	}

	polygon.selected {
		stroke: orange;
		fill: orange;
		stroke-width: 2;
	}

	path.selected {
		stroke: orange;
		fill: orange;
		stroke-width: 2;
		pointer-events: none;
	}

	line.selected {
		stroke: orange;
		stroke-width: 3;
		pointer-events: none;
	}

	.inline-list {
		display: flex;
		gap: 1em;
	}

	.element-link {
		cursor: pointer;
		text-decoration: underline;
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
			<legend>Load</legend>
			<select on:input|preventDefault={(evt) => {loadMesh(evt.currentTarget.value); evt.currentTarget.value=''}}>
				<option value="">---</option>
				{#each Object.keys(samples) as sample}
				<option>{sample}</option>
				{/each}
			</select>
		</fieldset>
	
		<fieldset>
			<legend>Vertices ({geometry.vertexPositions.length})</legend>
			<select readonly size="3" bind:value={selected}>
				{#each geometry.vertexPositions as _, vidx}
				<option>V{vidx}</option>
				{/each}
			</select>
		</fieldset>

		<fieldset>
			<legend>Halfedges ({geometry.halfEdgeSuccessorEdges.length})</legend>
			<select readonly size="3" bind:value={selected}>
				{#each geometry.halfEdgeSuccessorEdges as _, edgeId}
				<option>E{edgeId}</option>
				{/each}
			</select>
		</fieldset>

		<fieldset>
			<legend>Faces ({geometry.faceStartEdges.length})</legend>
			<select readonly size="3" bind:value={selected}>
				{#each geometry.faceStartEdges as _, faceId}
				<option>F{faceId}</option>
				{/each}
			</select>
		</fieldset>

		<fieldset style="min-height: 15em;">
			{#if selected && selected[0] === 'V'}
			<legend>Selected: Vertex {selected}</legend>
			<dl>
				<dt>Position</dt>
				<dd>{formatter.format(geometry.vertexPositions[1*selected.substr(1)].x)}, {formatter.format(geometry.vertexPositions[1*selected.substr(1)].y)}</dd>
				<dt>Successor Edge</dt>
				<dd><span class="element-link" on:click={clickSelectElement} data-edge={geometry.vertexSuccessorEdges[1*selected.substr(1)]}>E{geometry.vertexSuccessorEdges[1*selected.substr(1)]}</span></dd>
				<dt>Actions</dt>
				<dd>
					<button class="element-link" on:click|stopPropagation={clickRotateVertex} cursor="pointer" data-vertex={1*selected.substr(1)}>Rotate</button>
				</dd>
			</dl>
			{:else if selected && selected[0] === 'E'}
			<legend>Selected: Halfedge {selected} (<span class="element-link" on:click={() => {selected = null}}>unselect</span>)</legend>
			<dl>
				<dt>Succesor Edge</dt>
				<dd><span class="element-link" on:click={clickSelectElement} data-edge={geometry.halfEdgeSuccessorEdges[1*selected.substr(1)]}>E{geometry.halfEdgeSuccessorEdges[1*selected.substr(1)]}</span></dd>
				<dt>Succesor Vertex</dt>
				<dd><span class="element-link" on:click={clickSelectElement} data-vertex={geometry.halfEdgeSuccessorVertices[1*selected.substr(1)]}>V{geometry.halfEdgeSuccessorVertices[1*selected.substr(1)]}</span></dd>
				<dt>Partner Edge</dt>
				<dd><span class="element-link" on:click={clickSelectElement} data-edge={geometry.halfEdgePartners[1*selected.substr(1)]}>E{geometry.halfEdgePartners[1*selected.substr(1)]}</span></dd>
				<dt>Adjecent Face</dt>
				<dd><span class="element-link" on:click={clickSelectElement} data-face={geometry.halfEdgeFaces[1*selected.substr(1)]}>F{geometry.halfEdgeFaces[1*selected.substr(1)]}</span></dd>


				<dt>Actions</dt>
				<dd>
					<button class="element-link" on:click|stopPropagation={clickSplit} cursor="pointer" data-edge={1*selected.substr(1)}>Split</button>
				</dd>
			</dl>
			{:else if selected && selected[0] === 'F'}
			<legend>Selected: Face {selected} (<span class="element-link" on:click={() => {selected = null}}>unselect</span>)</legend>
			<dl>
				<dt>Start Edge</dt>
				<dd><span class="element-link" on:click={clickSelectElement} data-edge={geometry.faceStartEdges[1*selected.substr(1)]}>E{geometry.faceStartEdges[1*selected.substr(1)]}</span></dd>
				<dt>Actions</dt>
				<dd>
					<button class="element-link" on:click|stopPropagation={clickRotateFace} cursor="pointer" data-face={1*selected.substr(1)}>Rotate</button>
					{#if canTriangulateFace(1*selected.substr(1), geometry)}
					<button class="element-link" on:click|stopPropagation={clickTriangulate} cursor="pointer" data-face={1*selected.substr(1)}>Triangulate</button>
					{/if}
				</dd>
			</dl>
			{:else}
			<legend>Noting selected</legend>
			<p>Select a vertex, face or halfedge.</p>
			{/if}
		</fieldset>
	</header>


	<svg bind:this={svg} viewBox="-200 -200 400 400" stroke-width="2" font-size="9" text-anchor="middle" dominant-baseline="middle" on:click={() => {selected = null}} >
		<defs>
			<marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
				<path d="M0,0 L0,6 L9,3 z" fill="GoldenRod" />
			</marker>

			<marker id="halfarrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="strokeWidth">
				<path d="M0,0 L0,5 L9,5 z" fill="GoldenRod" />
			</marker>

			<symbol width="10" height="10" overflow="visible" id="rotationarrow" viewBox="0 0 8 8">
				<path transform="translate(-4 -4)" d="M3.967,0.643L3.969,1.208L3.784,1.219C3.35,1.242 2.928,1.354 2.521,1.553C1.515,2.047 0.83,2.993 0.669,4.108C0.635,4.342 0.634,4.781 0.668,5.006C0.809,5.99 1.327,6.816 2.145,7.363C2.343,7.497 2.712,7.676 2.94,7.752C3.988,8.095 5.127,7.907 6.017,7.241C6.186,7.115 6.495,6.814 6.622,6.653C7.056,6.099 7.305,5.445 7.346,4.736L7.357,4.561L6.883,4.564L6.409,4.569L6.398,4.734C6.335,5.755 5.591,6.648 4.59,6.901C4.357,6.96 4.196,6.975 3.9,6.966C3.591,6.957 3.416,6.923 3.141,6.819C2.615,6.621 2.158,6.226 1.888,5.737C1.558,5.141 1.493,4.446 1.706,3.801C1.955,3.051 2.598,2.442 3.364,2.236C3.51,2.198 3.804,2.152 3.915,2.152L3.976,2.152L3.979,2.72L3.984,3.287L5.129,2.492C5.758,2.057 6.275,1.691 6.277,1.684C6.28,1.668 4.002,0.08 3.978,0.08C3.972,0.08 3.967,0.333 3.967,0.643Z"/>

			</symbol>
		</defs>

		<path class:hidden={!showFaces} d="M-300,-300 L300,-300 L300,300 L-300,300Z M{
			faceVertices(geometry, 0).map(({x,y}) => x+','+y).reverse().join(' L')
		}Z" on:click|stopPropagation={clickSelectElement} data-face="0" class:selected={isFaceSelected(selected, 0)} fill-opacity="0.2" pointer-events="all" fill="none" fill-rule="evenodd" />

		<g class:hidden={!showFaces}>
		{#each geometry.faceStartEdges as startEdge, faceId}
			{@const pos = faceMeanPosition(geometry, faceId)}
			{@const halfEdge = geometry.faceStartEdges[faceId]}
			{@const edgeCenter = interpHalfEdgeOffset(0.5, 0, halfEdge, geometry)}
			{#if faceId > 0}
				<polygon on:click|stopPropagation={clickSelectElement} points={faceVertices(geometry, faceId).flatMap(({x,y}) => [x,y])} fill="SkyBlue" fill-opacity="0.2" data-face={faceId} class:selected={isFaceSelected(selected, faceId)}></polygon>
				<text class:hidden={!showLabels} x={pos.x} y={pos.y}>F {faceId}</text>
				<line class:hidden={!showTraversals} x1={pos.x} y1={pos.y + 10} x2={edgeCenter.x} y2={edgeCenter.y} stroke="GoldenRod" stroke-width="1" marker-end="url(#arrow)"></line>
				 
				<path class:hidden={!showControls || !canTriangulateFace(faceId, geometry)} d="M{pos.x}  {pos.y + 23} l3 0l-3 -6l-3 6" fill="brown"></path>
			
				<use href="#rotationarrow" class:hidden={!showRotators || !showTraversals} x={pos.x} y={pos.y + 10} r="4" />
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
				<text transform="rotate({((vertexA > vertexB ? 0 : -180) + labelPos.angle * 180 / Math.PI + 360 +90) % 180 - 90}, {labelPos.x}, {labelPos.y})" class:hidden={!showLabels} x={labelPos.x} y={labelPos.y + (vertexA > vertexB ? 8 : -8)}>e{currentEdge} [v{vertexA} to v{vertexB}] (o: {geometry.halfEdgePartners[currentEdge]}, f: {geometry.halfEdgePartners[currentEdge]})</text>

				<circle class:hidden={!showControls} cx={centerPoint.x} cy={centerPoint.y} r="3" fill="Tomato"></circle>
			{/each}
		</g>
		
		
		<g class:hidden={!showVertices}>
		{#each geometry.vertexPositions as {x,y}, vidx}
			{@const edgeCenter = interpHalfEdgeOffset(0.5, 0, geometry.vertexSuccessorEdges[vidx], geometry)}
			
			<line class:hidden={!showTraversals} x1={x} y1={y} x2={edgeCenter.x} y2={edgeCenter.y} stroke="GoldenRod" stroke-width="1" marker-end="url(#arrow)"></line>

			<circle cx={x} cy={y} r="4" fill="DeepPink">
			<title>{vidx}</title>
			</circle>
			<text class:hidden={!showLabels} x={x} y={y+(10*Math.sign(y||-1))}>
			v{vidx} (e{geometry.vertexSuccessorEdges[vidx]})
			</text>
			

			<use href="#rotationarrow" class:hidden={!showRotators || !showTraversals} stroke="none" x={x-10} y={y} fill="black">
			</use>
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
				<line on:click|stopPropagation={clickSelectElement} data-edge={currentEdge} x1={posA.x} y1={posA.y} x2={posB.x} y2={posB.y} stroke="none" vector-effect="non-scaling-stroke" stroke-width="10" cursor="default" pointer-events="stroke" class:selected={isEdgeSelected(selected, currentEdge)}></line>
			{/each}
		</g>
		
		<g class:hidden={!showControls || !showEdges}>
		{#each geometry.halfEdgeSuccessorEdges as _,currentEdge}
			{@const centerPoint = interpHalfEdgeOffset(0.5, 0, currentEdge, geometry)}

			<circle cx={centerPoint.x} cy={centerPoint.y} r="10" fill="none" pointer-events="fill" cursor="copy" on:mousedown={clickSplit} data-edge={currentEdge}>
				<title>Add Vertex</title>
			</circle>

		{/each}
		</g>

		<g class:hidden={!showVertices}>
		{#each geometry.vertexPositions as {x,y}, vidx}
			<circle on:click|stopPropagation={clickSelectElement} stroke="none" cx={x} cy={y} r="10" fill="none" pointer-events="fill" data-vertex={vidx} class:selected={isVertexSelected(selected, vidx)}>
			</circle>
		{/each}
		</g>
		
		<g class:hidden={!showVertices}>
		{#each geometry.vertexPositions as {x,y}, vidx}

			<circle class:hidden={!showRotators || !showTraversals} stroke="none" cx={x-10} cy={y} r="10" fill="none" pointer-events="fill" cursor="pointer" on:click|stopPropagation={clickRotateVertex} data-vertex={vidx}>
				<title>Rotate Vertex</title>
			</circle>

			<circle on:click|stopPropagation={clickSelectElement} class:hidden={!showControls} stroke="none" cx={x} cy={y} r="10" fill="none" pointer-events="fill" cursor="move" on:mousedown={dragStart} data-vertex={vidx} class:active={grabbedVertex === vidx}>
				<title>Drag Vertex</title>
			</circle>
		{/each}
		</g>
		
		<g class:hidden={!showFaces}>
		{#each geometry.faceStartEdges as startEdge, faceId}
			{@const pos = faceMeanPosition(geometry, faceId)}
			
			{#if faceId > 0 && canTriangulateFace(faceId, geometry)}
				<circle class:hidden={!showControls} cx={pos.x} cy={pos.y + 20} r="10" fill="none" pointer-events="fill" cursor="pointer" on:click={clickTriangulate} data-face={faceId}>
					<title>Triangulate Face</title>
				</circle>

			{/if}
			{#if faceId > 0}
			<circle class:hidden={!showRotators || !showTraversals} cx={pos.x} cy={pos.y + 10} r="10" fill="none" pointer-events="fill" on:click|stopPropagation={clickRotateFace} cursor="pointer" data-face={faceId} />
			{/if}
		{/each}
		</g>

	
	</svg>
	</div>

	<fieldset>
		<legend>View Options</legend>

		<ul class="inline-list">
			<li><label><input type="checkbox" bind:checked={showVertices} /> Vertices</label></li>
			<li><label><input type="checkbox" bind:checked={showEdges} /> Edges</label></li>
			<li><label><input type="checkbox" bind:checked={showFaces} /> Faces</label></li>
			<li><label><input type="checkbox" bind:checked={showLabels} /> Labels</label></li>
			<li><label><input type="checkbox" bind:checked={showControls} /> Controls</label></li>
			<li><label><input type="checkbox" bind:checked={showTraversals} /> Traversals</label></li>
			<li class:hidden={!showTraversals}><label><input type="checkbox" bind:checked={showRotators} /> Rotators</label></li>
		</ul>
	</fieldset>

	<fieldset>
		<legend>Export</legend>

		<div contenteditable style="user-select: all;" readonly>{JSON.stringify(geometry)}</div>
	</fieldset>

</article>