$(function() {
	var game = new Game();
	var operators = ['#add', '#subtract', '#multiply', '#divide'];
	var offset = [
		{left: -80, top: 50},
		{left: -27, top: 70},
		{left: +27, top: 70},
		{left: +80, top: 50}
	];
	var activeOperand = null;

	var showOperators = (function(position) {
		var above = position.top > 500;
		$.each(operators, function(i, e) {
			$(e).show()
			.offset(position)
			.css('opacity', 0)
			.animate({
				opacity: 1,
				left: '+=' + offset[i].left,
				top: above ? '-=' + (offset[i].top + $(e).height()) : '+=' + offset[i].top,
			}, 200);
		});
	});

	var hideOperators = (function() {
		$.each(operators, function(i, e) {
			$(e).hide();
		});
		activeOperand = null;
	});

	var draggableOptions = {
		cancel: "input,textarea,select,option",
		containment: "#arena",
		start: function(e, ui) {
			$(this).css('z-index', 1000);
		},
		stop: function(e, ui) {
			$(this).css('z-index', 0);
		}
	};

	var droppableOptions = {
		activate: function(e, ui) {
			ui.draggable.addClass('active');
		},
		deactivate: function(e, ui) {
			ui.draggable.removeClass('active');
		},
		drop: function(e, ui) {
			var rhs = $(this).data('bubble');
			var lhs = ui.draggable.data('bubble');

			if (rhs === "x" || lhs === "x") return;

			// if there's active operand separate them
			if (activeOperand !== null) {
				$('#bubble-x').trigger('dblclick');
			}

			var bubble = newBubble(lhs, rhs);

			showOperators({
				left: bubble.offset().left + bubble.width() / 2,
				top: bubble.offset().top + bubble.height() / 2
			});
			activeOperand = {
				lhs: lhs,
				rhs: rhs
			}

			$(this).hide();
			ui.draggable.hide();
		},
		hoverClass: 'active'
	};

	var newBubble = (function(lhs, rhs) {
		var dom = $("<button/>", {
			"class": "round bubble",
			"id": "bubble-x",
			"data-bubble": "x",
			"data-bubble-lhs": lhs,
			"data-bubble-rhs": rhs,
			"text": $("#bubble-" + lhs).text() + " ... " + $("#bubble-" + rhs).text()
		}).appendTo('.game-arena');
		dom.offset({
			left: $("#bubble-" + lhs).offset().left,
			top: $("#bubble-" + lhs).offset().top
		})
		dom.draggable(draggableOptions);
		dom.droppable(droppableOptions);
		dom.show();
		return dom;
	});

	var changeMenu = (function(menu) {
		// hide the others
		$('.game-arena, .game-menu').hide();

		// show it!
		$('#' + menu).show();
	});
	// change to main menu
	changeMenu("main-menu");

	$('body').on('click', '.operator', function() {
		if (!activeOperand) return;

		var lhs = activeOperand.lhs;
		var rhs = activeOperand.rhs;

		var result = game.marry({
			lhs: lhs,
			rhs: rhs,
			op: $(this).data("op")
		});

		if (result === undefined) {
			$("#bubble-x").trigger('dblclick');
			return;
		}

		var dom = $("#bubble-x");
		dom.data("bubble", result.i);
		dom.text(result.rep);
		dom.attr("id", "bubble-" + result.i);

		hideOperators();
		activeOperand = null;
	});

	$('body').on('dblclick', '.bubble', function() {
		var bubble = $(this).data("bubble");

		if (!bubble || bubble === 'x') {
			hideOperators();
		} else {
			game.divorce(bubble);
		}

		var lhs = $(this).data("bubble-lhs");
		var rhs = $(this).data("bubble-rhs");
		if (typeof lhs !== "undefined" && typeof rhs !== "undefined") {
			$("#bubble-" + lhs).show();
			$("#bubble-" + rhs).show();
			// TODO: place them accordingly
			$("#bubble-" + lhs).offset({
				left: $(this).offset().left - 60,
				top: $(this).offset().top
			});
			$("#bubble-" + rhs).offset({
				left: $(this).offset().left + 60,
				top: $(this).offset().top
			});

			// destroy this
			$(this).remove();
		}
	});

	// draggable + droppable
	$('.bubble').draggable(draggableOptions);
	$('.bubble').droppable(droppableOptions);

	// reset bubbles!
	var reset = (function () {
		var bubbleOffset = [
			{left: 120, top: 50},
			{left: 280, top: 50},
			{left: 120, top: 230},
			{left: 280, top: 230}
		];

		// hide other bubbles
		for (var i = 4; i < 100; ++i) {
			var dom = $("#bubble-" + i);
			if (dom) dom.remove();
		}
		var dom = $("#bubble-x");
		if (dom) dom.remove();
		hideOperators();

		// setup the 4 main bubbles and arena
		changeMenu('arena');
		var numbers;
		if (game.win()) {
			numbers = game.nextLevel();
		} else {
			numbers = game.restart();
		}
		var offset = $('.game-arena').offset();
		for (var i = 0; i < 4; ++i) {
			var bubble = $("#bubble-" + i);
			bubble.show();
			bubble.offset({
				left: offset.left + bubbleOffset[i].left,
				top: offset.top + bubbleOffset[i].top
			});
			bubble.text(numbers[i]);
		}

		// set timer
		var timer = setInterval(function() {
			var timeLeft = game.getTimeLeft();
			$('#timer').text((timeLeft < 10 ? "0" : "") + timeLeft);
			$('#score').text(game.getScore());
			if (game.over()) {
				// alert("answer = " + game.getAnswer());
				// reset();
				clearInterval(timer);
				if (game.win()) {
					changeMenu('level-menu');
				} else {
					var answer = game.getAnswer();
					$('#solution').text(answer ? "24 = " + answer : "24 cannot be obtained");
					changeMenu('gameover-menu');
				}
			}
		}, 100);
	});

	$('#no-solution').click(function() {
		game.guessUnsolved();
	});

	$('#play, #next-level, #restart').on('click', function() {
		reset();
	});

	$('#home').on('click', function() {
		changeMenu('main-menu');
	})
});