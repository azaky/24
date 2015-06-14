$(function() {
	var game = new Game();
	var operators = ['#add', '#subtract', '#multiply', '#divide'];
	var activeOperand = null;
	var currentOperatorOffset = null;

	var scale = $(".container").width() === 500 ? 1 : 0.65;
	$(window).resize(function() {
		scale = $(".container").width() === 500 ? 1 : 0.65;
	});

	var showOperators = (function(position) {
		var above = position.top > 500;
		var offset = [
			{left: -120, top: 50},
			{left: -40, top: 70},
			{left: +40, top: 70},
			{left: +120, top: 50}
		];
		currentOperatorOffset = [];
		for (var i = 0; i < 4; ++i) {
			var temp = {
				left: offset[i].left,
				top: offset[i].top
			}
			if (above) {
				temp.top = offset[i].top + $(operators[i]).height();
			}
			temp.left *= scale;
			temp.top *= scale;
			currentOperatorOffset.push(temp);
		}
		$.each(operators, function(i, e) {
			$(e).show()
			.offset(position)
			.css('opacity', 0)
			.animate({
				opacity: 1,
				left: '+=' + currentOperatorOffset[i].left,
				top: '+=' + currentOperatorOffset[i].top,
			}, 200);
		});
	});

	var hideOperators = (function() {
		$.each(operators, function(i, e) {
			$(e).hide();
		});
		activeOperand = null;
		currentOperatorOffset = null;
	});

	var draggableOptions = {
		cancel: "input,textarea,select,option",
		containment: "#arena",
		start: function(e, ui) {
			$(this).css('z-index', 1000);
		},
		stop: function(e, ui) {
			$(this).css('z-index', 0);
		},
		drag: function(e, ui) {
			if (currentOperatorOffset && $(this).attr("id") === "bubble-x") {
				var offset = {
					left: $(this).offset().left + $(this).width() / 2,
					top: $(this).offset().top + $(this).height() / 2
				};
				$.each(operators, function(i, e) {
					$(e).offset({
						left: offset.left + currentOperatorOffset[i].left,
						top: offset.top + currentOperatorOffset[i].top
					});
				});
			}
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
				$('#bubble-x').trigger('click');
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
			"class": "bubble",
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
			$("#bubble-x").trigger('click');
			return;
		}

		var dom = $("#bubble-x");
		dom.data("bubble", result.i);
		dom.text(result.rep);
		dom.attr("id", "bubble-" + result.i);

		hideOperators();
		activeOperand = null;
	});

	$('body').on('click', '.bubble', function() {
		if ($(this).hasClass('active')) {
			return;
		}
		
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
				left: $(this).offset().left - 60 * scale,
				top: $(this).offset().top
			});
			$("#bubble-" + rhs).offset({
				left: $(this).offset().left + 60 * scale,
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
			{left: 260, top: 50},
			{left: 120, top: 190},
			{left: 260, top: 190}
		];

		if (scale !== 1) {
			bubbleOffset = [
				{left: 50, top: 50},
				{left: 150, top: 50},
				{left: 50, top: 150},
				{left: 150, top: 150}
			];
		}

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

		// Reset score
		$('#score').text(game.getScore());

		// set timer
		var timer = setInterval(function() {
			var timeLeft = game.getTimeLeft();
			$('#timer').text(timeLeft);
			if (game.over()) {
				$('#score').text(game.getScore());
				$('#best-score').text(game.getHighScore());

				clearInterval(timer);
				if (game.win()) {
					changeMenu('level-menu');
				} else {
					var answer = game.getAnswer();
					$('#solution').text(answer ? "24 = " + answer : "Unsolvable");
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

	$('#best-score').text(game.getHighScore());

	$('#share').on('click', function() {
		return false;
		var href = "https://www.facebook.com/dialog/share?app_id=860866040655001&display=popup" + 
				"&href=http://azaky.github.io/24" + 
				"&redirect_uri=https%3A%2F%2Fdevelopers.facebook.com%2Ftools%2Fexplorer" +
				"&caption=Halo huba huba";
		return !window.open(href, 'Facebook', 'width=640,height=300');
	});
});