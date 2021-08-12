/**
 * 24
 * 
 * @author Ahmad Zaky
 */

var Game = function(args) {
	// All of this will be private variables
	var goal = args && args.goal || 24;
	var n = args && args.n || 4;
	var maxNumber = args && args.maxNumber || 10;
	var epsilon = 1e-7;

	var answer = false, solved = false, fail = false;
	var bubbles = [];
	var numbers = [];

	var level = 0;
	var timeLeft = 0, timeStopper;

	// Dummy storage if browser doesn't support it
	var storage = {
		_data: {},

		setItem: function (id, val) {
			return this._data[id] = String(val);
		},

		getItem: function (id) {
			return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
		},

		removeItem: function (id) {
			return delete this._data[id];
		},

		clear: function () {
			return this._data = {};
		}
	};
	storage = (function() {
		var testKey = "test";
		var _storage = window.localStorage;

		try {
			_storage.setItem(testKey, "1");
			_storage.removeItem(testKey);
			return _storage;
		} catch (error) {
			return storage;
		}
	}());

	var that = this;

	// Check if the current numbers can achieve the desired goal.
	// The technique being used is dynamic programming with bitmask on the indices.
	var checkAnswer = (function() {
		// The dp[mask] will contain an array, each of which will be an object containing
		// the value and the expression.
		var dp = [[]];
		var countBrackets = (function(expr){
			var ret = 0;
			for (var i = 0; i < expr.length; ++i) {
				if (expr[i] === '(' || expr[i] === ')') ret++;
			}
			return ret;
		});

		// Fill the table in a bottom-up fashion
		for (var mask = 1; mask < (1 << n); ++mask) {
			// Array of the active bits
			var bits = [];
			for (var i = 0; i < n; ++i) {
				if (mask & (1 << i)) {
					bits.push(i);
				}
			}

			// Initialize the dp table with single element values
			if (bits.length === 1) {
				dp[mask] = [{
					value: numbers[bits[0]],
					expr: numbers[bits[0]],
					last: ""
				}];
			} else {
				// The set that indicates the used values
				var used = {};
				var temp = [];

				// Find two masks that can be combined to mask
				for (var mask1 = 1; mask1 < (1 << n); ++mask1) {
					if ((mask1 & mask) === mask1 && mask1 !== mask) {
						var mask2 = mask ^ mask1;
						if (!dp[mask1] || !dp[mask2]) continue;

						// Combine all the values in mask1 and mask2 to mask
						// Try all valid operators
						for (var i = 0; i < dp[mask1].length; ++i) {
							for (var j = 0; j < dp[mask2].length; ++j) {
								dp1 = dp[mask1][i];
								dp1.value = Number(dp1.value);
								dp2 = dp[mask2][j];
								dp2.value = Number(dp2.value);

								var possibilities = [
									{ // Addition
										value: dp1.value + dp2.value,
										expr: dp1.expr + " + " + dp2.expr + "",
										last: "+-"
									},
									{ // Subtraction
										value: dp1.value - dp2.value,
										expr: dp1.expr + " - " + (dp2.last === "+-" ? "(" : "") + dp2.expr + (dp2.last === "+-" ? ")" : ""),
										last: "+-"
									},
									{ // Subtraction
										value: dp2.value - dp1.value,
										expr: dp2.expr + " - " + (dp1.last === "+-" ? "(" : "") + dp1.expr + (dp1.last === "+-" ? ")" : ""),
										last: "+-"
									},
									{ // Multiplication
										value: dp1.value * dp2.value,
										expr: (dp1.last === "+-" ? "(" : "") + dp1.expr + (dp1.last === "+-" ? ")" : "") +
												" x " + (dp2.last === "+-" ? "(" : "") + dp2.expr + (dp2.last === "+-" ? ")" : ""),
										last: "x/"
									}];

								// Special case for division, make sure the denominator is not zero
								if (dp1.value) {
									possibilities.push({
										value: dp2.value / dp1.value,
										expr: (dp2.last === "+-" ? "(" : "") + dp2.expr + (dp2.last === "+-" ? ")" : "") +
												" / " + (dp1.last ? "(" : "") + dp1.expr + (dp1.last ? ")" : ""),
										last: "x/"
									});
								}
								if (dp2.value) {
									possibilities.push({
										value: dp1.value / dp2.value,
										expr: (dp1.last === "+-" ? "(" : "") + dp1.expr + (dp1.last === "+-" ? ")" : "") +
												" / " + (dp2.last ? "(" : "") + dp2.expr + (dp2.last ? ")" : ""),
										last: "x/"
									});
								}

								// Perform check on all of them
								for (var k = 0; k < possibilities.length; ++k) {
									var brackets = countBrackets(possibilities[k].expr);
									if (!used[possibilities[k].value] || used[possibilities[k].value].brackets > brackets) {
										used[possibilities[k].value] = possibilities[k];
										used[possibilities[k].value].brackets = brackets;
									}
								}
							}
						}
					}
				}

				// Insert it into dp table
				dp[mask] = [];
				for (key in used) {
					if (used.hasOwnProperty(key)) {
						dp[mask].push(used[key]);
					}
				}
			}
		}

		// Finally, check if goal can be achieved using all numbers
		var _answer = [];
		var goalmask = (1 << n) - 1;
		var minBrackets = n * 2;
		var iminBrackets = 0;
		for (var i = 0; i < dp[goalmask].length; ++i) {
			if (Math.abs(dp[goalmask][i].value - goal) < epsilon) {
				_answer.push(dp[goalmask][i]);
				var curBrackets = countBrackets(dp[goalmask][i].expr);
				if (curBrackets < minBrackets) {
					iminBrackets = _answer.length - 1;
					minBrackets = curBrackets;
				}
			}
		}
		// move one with min brackets to front
		if (_answer.length) {
			var temp = _answer[0];
			_answer[0] = _answer[iminBrackets];
			_answer[iminBrackets] = temp;
		}
		return _answer;
	});

	// Randomly generate numbers.
	var generate = (function() {
		numbers = [];
		for (var i = 0; i < n; ++i) {
			numbers[i] = Math.floor(Math.random() * maxNumber) + 1;
		}
		answer = checkAnswer();
		if (!answer.length) {
			answer = false;
		} else {
			answer = answer[0].expr;
		}
	});

	// Finish game, the argument is the outcome
	var finishGame = (function(result) {
		if (result) {
			solved = true;
		} else {
			fail = true;
		}
		clearInterval(timeStopper);

		// update high score
		var highScore = storage.getItem("highScore");
		var curScore = that.getScore();
		if (highScore === null || curScore > highScore) {
			highScore = curScore;
		}
		storage.setItem("highScore", highScore);
	});

	// Action taken when two bubbles are combined: "Marry" them.
	this.marry = function(args) {
		if (this.over()) return;

		// check whether both arguments still available
		if (args.lhs === undefined || args.rhs === undefined || args.lhs === args.rhs || !bubbles[args.lhs] || !bubbles[args.rhs] || bubbles[args.lhs].used || bubbles[args.rhs].used) {
			return;
		}

		var last = bubbles.length;
		var value, rep;
		var n1 = bubbles[args.lhs].value;
		var n2 = bubbles[args.rhs].value;

		switch (args.op) {
		case '+':
			value = n1 + n2;
			break;
		case '-':
			value = n1 - n2;
			break;
		case '*':
		case 'x':
		case 'X':
			value = n1 * n2;
			break;
		case '/':
			if (Math.abs(n2) < epsilon) {
				// division by zero
				return;
			}
			value = n1 / n2;
			break;
		default:
			alert("op = [" + args.op + "]");
			return;
		}

		// calculate proper representation
		rep = "" + Math.round(value);
		if (Math.abs(Math.round(value) - value) > epsilon) {
			// just brute force then
			for (var den = 1; ; ++den) {
				var num = den * value;
				if (Math.abs(Math.round(num) - num) < epsilon) {
					rep = "" + Math.round(num) + "/" + den;
					break;
				}
			}
		}

		bubbles.push({
			i: last,
			value: value,
			rep: rep,
			lhs: args.lhs,
			rhs: args.rhs,
			used: false
		});
		bubbles[args.lhs].used = true;
		bubbles[args.rhs].used = true;

		// backtrack to see all numbers used
		var mask = 0;
		var dfs = function(i) {
			if (i < n) {
				mask |= (1 << i);
			} else {
				dfs(bubbles[i].lhs);
				dfs(bubbles[i].rhs);
			}
		}
		dfs(last);
		if (mask === (1 << n) - 1 && Math.abs(value - goal) < epsilon) {
			finishGame(true);
		}

		return bubbles[last];
	}

	// Separate combined bubbles: "Divorce" them.
	this.divorce = function(i) {
		if (this.over()) return;

		if (bubbles[i] && bubbles[i].hasOwnProperty('lhs') && bubbles[i].hasOwnProperty('rhs')) {
			var lhs = bubbles[bubbles[i].lhs];
			var rhs = bubbles[bubbles[i].rhs];
			lhs.used = rhs.used = false;
			bubbles[i] = undefined;

			return {
				lhs: lhs,
				rhs: rhs
			}
		}
	}

	// Restart game
	this.restart = function() {
		// force quit current game
		if (!this.over()) {
			clearInterval(timeStopper);
		}

		// A little workaround so nextLevel won't return void
		timeLeft = 0;
		solved = true;
		fail = false;

		level = 0;
		return this.nextLevel();
	}

	// Go to the next level
	this.nextLevel = function() {
		if (!this.over() || this.lose()) {
			return;
		}

		generate();
		level++;
		bubbles = [];
		for (var i = 0; i < n; ++i) {
			bubbles[i] = {
				i: i,
				value: numbers[i],
				rep: numbers[i],
				used: false
			}
		}
		solved = false;
		fail = false;

		// run the timer
		timeLeft += this.getTimeAddition();
		timeStopper = setInterval(function() {
			timeLeft--;
			if (timeLeft <= 0) {
				timeLeft = 0;
				finishGame(false);
			}
		}, 1000);

		// return the numbers
		return numbers;
	}

	// Guess if this level cannot be solved
	this.guessUnsolved = function() {
		if (this.over()) {
			return;
		}
		if (!answer) {
			finishGame(true);
			return true;
		} else {
			finishGame(false);
			return false;
		}
	}

	// Check whether we win or not
	this.win = function() {
		return solved;
	}

	// Check whether we lose or not
	this.lose = function() {
		return fail;
	}

	// Check whether the game is over or not
	this.over = function() {
		return this.win() || this.lose();
	}

	// Get the time addition for current level.
	this.getTimeAddition = function() {
		if (level === 1) {
			return 60 - timeLeft;
		}
		return Math.ceil(30 / level);
	}

	// Get the time left for the current level
	this.getTimeLeft = function() {
		return timeLeft;
	}

	// Get current level
	this.getLevel = function() {
		return level;
	}

	// Get score
	this.getScore = function() {
		return level + (this.win() ? 0 : -1);
	}

	// Get high score
	this.getHighScore = function() {
		var highScore = storage.getItem("highScore");
		if (highScore === null) {
			highScore = 0;
			storage.setItem("highScore", highScore);
		}
		return highScore;
	}

	// Get the answer IF the game is already over
	this.getAnswer = function() {
		if (!this.over()) {
			return "Nice try, don't cheat :)";
		} else {
			return answer;
		}
	}

	// Get the numbers
	this.getNumbers = function() {
		return numbers;
	}

	// Get the bubbles
	this.getBubbles = function() {
		return bubbles;
	}

	// Last but not the least:
	return this;
}
