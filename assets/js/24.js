/**
 * 24
 * 
 * @author Ahmad Zaky
 */

/**
 * 
 */
var Game = function(goal, n, maxNumber) {
	this.goal = goal;
	this.n = n;
	this.maxNumber = maxNumber;
	this.numbers = [];
}

/**
 * Randomly generate numbers.
 */
Game.prototype.generate = function() {
	this.numbers = new Array(this.n);
	for (i = 0; i < this.n; ++i) {
		this.numbers[i] = Math.floor(Math.random() * this.maxNumber) + 1;
	}
}

/**
 * Check if the current numbers can achieve the desired goal.
 * The technique being used is dynamic programming with bitmask on the indices.
 */
Game.prototype.check = function() {
	// The dp[mask] will contain an array, each of which will be an object containing
	// the value and the expression.
	var dp = [[]];

	// Fill the table in a bottom-up fashion
	for (mask = 1; mask < (1 << this.n); ++mask) {
		// Array of the active bits
		var bits = [];
		for (i = 0; i < this.n; ++i) {
			if (mask & (1 << i)) {
				bits.push(i);
			}
		}

		// Initialize the dp table with single element values
		if (bits.length == 1) {
			dp[mask] = [{
				value: this.numbers[bits[0]],
				expr: this.numbers[bits[0]]
			}];
		} else {
			// The set that indicates the used values
			var used = {};
			var temp = [];

			// Find two masks that can be combined to mask
			for (mask1 = 1; mask1 < (1 << this.n); ++mask1) {
				if ((mask1 & mask) == mask1 && mask1 != mask) {
					mask2 = mask ^ mask1;
					if (!dp[mask1] || !dp[mask2]) continue;

					// Combine all the values in mask1 and mask2 to mask
					// Try all valid operators
					for (i = 0; i < dp[mask1].length; ++i) {
						for (j = 0; j < dp[mask2].length; ++j) {
							dp1 = dp[mask1][i];
							dp1.value = Number(dp1.value);
							dp2 = dp[mask2][j];
							dp2.value = Number(dp2.value);

							var possibilities = [
								{ // Addition
									value: dp1.value + dp2.value,
									expr: "(" + dp1.expr + ") + (" + dp2.expr + ")" 
								},
								{ // Subtraction
									value: dp1.value - dp2.value,
									expr: "(" + dp1.expr + ") - (" + dp2.expr + ")" 
								},
								{ // Subtraction
									value: dp2.value - dp1.value,
									expr: "(" + dp2.expr + ") - (" + dp1.expr + ")" 
								},
								{ // Multiplication
									value: dp1.value * dp2.value,
									expr: "(" + dp1.expr + ") * (" + dp2.expr + ")" 
								}];

							// Special case for division, make sure the denominator is not zero
							if (dp1.value) {
								possibilities.push({
									value: dp2.value / dp1.value,
									expr: "(" + dp2.expr + ") / (" + dp1.expr + ")" 
								});
							}
							if (dp2.value) {
								possibilities.push({
									value: dp1.value / dp2.value,
									expr: "(" + dp1.expr + ") / (" + dp2.expr + ")" 
								});
							}

							// Perform check on all of them
							possibilities.forEach(function(e) {
								if (!used[e.value]) {
									used[e.value] = true;
									temp.push(e);
								}
							});
						}
					}
				}
			}

			// Insert it into dp table
			if (temp.length) dp[mask] = temp;
		}
	}

	// Finally, check if goal can be achieved using all numbers
	var answer = [];
	var thisgoal = this.goal;
	dp[(1 << this.n) - 1].forEach(function(e) {
		if (Math.abs(e.value - thisgoal) < 1e-7) {
			answer.push(e);
		}
	});
	return answer;
}

