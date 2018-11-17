$(document).ready(function () {

	const rowCount = 14
	const colCount = 24

	const modes = {
		BUILD_WALL:  1,
		BUILD_ENTRY: 2,
		BUILD_EXIT:  3,
		PLAYING: 4
	}

	const selectors = {
		CLICKABLE: 'div#maze div.row div',
		MAZE: '#maze',
		SPEED_INPUT: '#speedInput'
	}

	const classes = {
		ROW: 'row',
		VISITED: 'visited',
		ENTRY: 'entry',
		EXIT: 'exit',
		WALL: 'wall'
	}

	const exceptionMessages = {
		FOUND_EXIT: 'EXIT_FOUND',
		NOT_FOUND_EXIT: 'EXIT_NOT_FOUND'
	}

	const userFacingMessages = {
		DFS: {
			FOUND_EXIT: 'YAY! I Escaped!<br>The Algorithm worked out where to find the exit by heading as deep as possible- each maze cell\'s neighbour until is visited every cell it needed to find it\'s way out!',
			NOT_FOUND_EXIT: ':( I Couldn\'t find the exit.. this time!'
		},
		BFS :{
			FOUND_EXIT: 'YAY! I Escaped!<br>The Algorithm worked out where to find the exit by visiting the start Maze cell\'s neighbour and all other immediate neighbours and continually increased depth when it couldn\'t find the exit straight away!',
			NOT_FOUND_EXIT: ':( I Couldn\'t find the exit.. this time!'
		}
	}

	const DEFAULT_SLEEP_LENGTH = 100

	let mode = modes.BUILD_WALL

	buildMaze(rowCount, colCount)

	setImmutableCells(classes.ROW)

	attachCellClickEventListeners(selectors.CLICKABLE)

	$('.btn-entry').on('click', function () {
		if (mode == modes.PLAYING) return	
		mode = modes.BUILD_ENTRY
	})
	$('.btn-exit').on('click', function () {
		if (mode == modes.PLAYING) return	
		mode = modes.BUILD_EXIT
	})
	$('.btn-wall').on('click', function () {
		if (mode == modes.PLAYING) return	
		mode = modes.BUILD_WALL
	})

	$('.btn-start-dfs').on('click', async function () {
		if (mode == modes.PLAYING) return

		mode = modes.PLAYING
		startPosition = findPosition(classes.ENTRY)

		try {
			var traversalSpeed = parseInt($(selectors.SPEED_INPUT).val())
			$(selectors.SPEED_INPUT).prop('disabled', true)
			await doDfs(startPosition, traversalSpeed)
		} catch (e) {
			let modalText
			if (e.indexOf(exceptionMessages.NOT_FOUND_EXIT) > -1) {				
				modalText = userFacingMessages.DFS.NOT_FOUND_EXIT
			} else {
				modalText = userFacingMessages.DFS.FOUND_EXIT
			}

			let modal = `<div class="modal"><h2>`+ modalText +`</h2></div>`
			$(modal).appendTo('body').modal()
			$(selectors.SPEED_INPUT).prop('disabled', false)
		}

		mode = modes.BUILD_WALL
		rebuildMaze(rowCount, colCount)
		setImmutableCells(classes.ROW)
		attachCellClickEventListeners(selectors.CLICKABLE)
	})

	$('.btn-start-bfs').on('click', async function () {
		if (mode == modes.PLAYING) return	

		mode = modes.PLAYING
		startPosition = findPosition(classes.ENTRY)

		try {
			var traversalSpeed = parseInt($(selectors.SPEED_INPUT).val())
			$(selectors.SPEED_INPUT).prop('disabled', true)
			await doBfs(startPosition, traversalSpeed)
		} catch (e) {
			let modalText
			if (e.indexOf(exceptionMessages.NOT_FOUND_EXIT) > -1) {
				modalText = userFacingMessages.BFS.NOT_FOUND_EXIT
			} else {
				modalText = userFacingMessages.BFS.FOUND_EXIT
			}

			let modal = `<div class="modal"><h2>`+ modalText +`</h2></div>`
			$(modal).appendTo('body').modal()
			$(selectors.SPEED_INPUT).prop('disabled', false)
		}

		mode = modes.BUILD_WALL
		rebuildMaze(rowCount, colCount)
		setImmutableCells(classes.ROW)
		attachCellClickEventListeners(selectors.CLICKABLE)
	})
	
	function ensureNoClass(clazz) {
		$('.'+classes.ROW).each(function () {
			$(this).children().each(function () {
				let e = $(this)
				e.hasClass(clazz) && e.removeClass(clazz)
			})
		})
	}

	function findPosition(clazz) {
		let pos = null
		$('.'+classes.ROW).each(function (ir) {
			$(this).children().each(function (ic) {
				if ($(this).hasClass(clazz)) {
					pos = {'row': ir, 'col': ic}
				}
			})
		})
		return pos
	}

	async function doDfs(v, speed) {

		let stack = []
		stack.push(v)

		while ( stack.length > 0 ) {
			await sleep(DEFAULT_SLEEP_LENGTH / speed)

			let u = stack.pop()
			let el = getCell(u)

			if (! el) continue
			
			if ( el.hasClass(classes.VISITED) ) {
				continue
			} else if ( el.hasClass(classes.WALL) ) {
				continue
			} else if ( el.hasClass(classes.EXIT) ) {
				throw exceptionMessages.FOUND_EXIT + u.row + ', ' + u.col
			}

			el.addClass(classes.VISITED)

			stack.push({row: u.row+1, col: u.col})
			stack.push({row: u.row, col: u.col+1})
			stack.push({row: u.row-1, col: u.col})
			stack.push({row: u.row, col: u.col-1})

		}

		throw exceptionMessages.NOT_FOUND_EXIT

	}

	async function doBfs(v, speed) {

		let queue = []
		queue.push(v)

		while ( queue.length > 0 ) {

			await sleep(DEFAULT_SLEEP_LENGTH / speed)

			let u = queue.shift()
			let el = getCell(u)

			if (! el) continue
			
			if ( el.hasClass(classes.VISITED) ) {
				continue
			} else if ( el.hasClass(classes.WALL) ) {
				continue
			} else if ( el.hasClass(classes.EXIT) ) {
				throw exceptionMessages.FOUND_EXIT + u.row + ', ' + u.col
			}

			el.addClass(classes.VISITED)

			queue.push({row: u.row+1, col: u.col})
			queue.push({row: u.row, col: u.col+1})
			queue.push({row: u.row-1, col: u.col})
			queue.push({row: u.row, col: u.col-1})

		}

		throw exceptionMessages.NOT_FOUND_EXIT
	}

	function getCell(position) {
		let row = position.row
		let col = position.col

		if (row < 0 || 
			col < 0 || 
			row >= rowCount || 
			col >= colCount) {
			return null
		}

		return $( $( $( '.'+classes.ROW ).get( row ) ).children().get( col ) )
	}

	function setImmutableCells(rowClassName) {

		$(
			$(
				$('.'+rowClassName).get(1)
			).children().get(1)
		).addClass(classes.ENTRY)
		
		$(
			$(
				$('.'+rowClassName).get(rowCount-2)
			).children().get(colCount-2)
		).addClass(classes.EXIT)

		$('.'+rowClassName).first().children().each(function () {
			$(this).addClass('perm wall no-pointer')
		})
		
		$('.'+rowClassName).last().children().each(function () {
			$(this).addClass('perm wall no-pointer')
		})

		$('.'+rowClassName).each(function () {
			$(this).children().first().addClass('perm wall no-pointer')
			$(this).children().last().addClass('perm wall no-pointer')
		})

	}

	function attachCellClickEventListeners(clickableCellSelector) {

		$( clickableCellSelector ).on('click', function () {

			let e = $(this)

			if (e.hasClass('perm'))
				return

			if (mode == modes.BUILD_WALL) {

				e.toggleClass(classes.WALL)
			
			} else if (mode == modes.BUILD_ENTRY) {
			
				if (! e.hasClass(classes.EXIT)) {					
					ensureNoClass(classes.ENTRY)
					e.addClass(classes.ENTRY)
					e.removeClass(classes.WALL)
				}
			
			} else if (mode == modes.BUILD_EXIT) {
			
				if (! e.hasClass(classes.ENTRY)) {	
					ensureNoClass(classes.EXIT)
					e.addClass(classes.EXIT)
					e.removeClass(classes.WALL)
				}
			
			}

		})
	}

	function rebuildMaze(rowCount, colCount) {

		$( selectors.MAZE + ' div' ).detach()
		buildMaze(rowCount, colCount)

	}

	function buildMaze(rowCount, colCount) {

		let row = null

		for ( i = 0; i < rowCount; i++ ) {

			row = document.createElement( 'div' )
			row.className = classes.ROW

			$( selectors.MAZE ).append( row )

			for ( j = 0; j < colCount; j++) {
				$( row ).append( document.createElement( 'div' ) )
			}
		}

	}

	function sleep(ms) {
  		return new Promise(
  			resolve => setTimeout(resolve, ms)
  		);
	}

})