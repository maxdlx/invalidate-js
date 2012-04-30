(function($) {
	$.fn.invalidate = function(options) {
		var version = "0.5",
			opts = $.extend({
				'patterns'			: {
							"email" : new RegExp(/\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4})\b/i), 
							"url"   : new RegExp(/^http:\/\//),
							"number": new RegExp(/\d*/)
				},
				'errorFunction'		: null, /* markup function */
				'successFunction'	: null, /* markup function */
				'requiredMsg'		: 'Bitte f&uuml;llen Sie das Feld aus!',
				'invalidMsg'		: 'Bitte geben Sie einen g&uuml;ltigen Wert ein!',
				'successMsg'		: 'OK',
				'icons'				: true,
				'live'				: true,
				'verbose'			: false
			}, options);

		// Example:
		// {
		// 	'errorFunction'		: function(msg, $el) {
		// 		alert(msg);
		// 		$el.focus();
		// 	},
		// 	'successFunction'	: function() {}
		// }

		return this.each(function() {
			var $el, $form = $(this),
				$reqs = $("[required], [pattern], [minlength], [maxlength]", $el);

			function log(msg) {
				if (!window.console || !opts.verbose) 
					return;
				
				if (typeof msg !== "string")
					console.dir(msg);
				else
					console.log(msg);
			}

			function validateAll() {
				var errCount = 0;
				log("validateAll() called");
				$reqs.each(function() {
					if (! require.apply(this))
						errCount ++;
				});
				log("validateAll() returns; returnValue: " + errCount);
				return errCount == 0;
			}

			function requireListener(event) {
				log("requireListener() called");
				log("requireListener() returns");
				return require.apply(this);
			}

			function require(el) {
				$el = (typeof el  !== "undefined") ? $(el) : $(this);
				var disabled = $el.attr('disabled'),
					readonly = $el.attr('readonly'),
					name = $el.attr('name') + "",
					min = $el.attr('min') ? parseInt($el.attr('min'), 10) : 0,
					max = $el.attr('max') ? parseInt($el.attr('max'), 10) : 0,
					minlength = $el.attr('minlength') ? parseInt($el.attr('minlength'), 10) : 0,
					maxlength = $el.attr('maxlength') ? parseInt($el.attr('maxlength'), 10) : 0,
					pat = $el.attr('pattern') ? $el.attr('pattern') : "",
					rel = $el.attr('rel') ? $el.attr('rel') : "",
					type = $el.attr('type') ? $el.attr('type') : "",
					val = $el.val() ? $el.val().trim() : "";

				log("require() called");

				if (disabled || readonly)
					return log("require() returns; returnValue: false") && 0;

				log("require(): name: " + name);
				log("require(): type: " + type);
				if (name.length && (type == "checkbox" || type == "radio" || type == "hidden")) {
					// Hidden field (useful for multiple checkboxes / radio buttons)
					if (type == "hidden") {
						return $("[name^='" + name + "']", $el.get(0).form).filter(":checked, :selected").length ? showSuccess() : showError("required"); // Find related checkboes / radio buttons that are marked
					}

					// Checkbox / radio button with hidden required field
					var hiddenInput = $("[name^='" + name + "']:hidden", $el.get(0).form).eq(0).get(0); // get DOMElement
					log("require(): hiddenInput:");
					log(hiddenInput);
					if (hiddenInput && hiddenInput.length)
						return require.apply(hiddenInput);
				}
				
				// Validate patterns
				if (val.length) {
					// Radio buttons
					if (type == "radio" && !$el.is(":checked"))
						return showError("required");
					// Checkboxes
					if (type == "checkbox" && !$el.is(":checked"))
						return showError("required");
					// Numeric input
					if (type == "number" && !parseInt(val, 10))
						return showError("invalid");
					// Numeric input (mininum value)
					if (type == "number" && parseInt(val, 10) < min)
						return showError("invalid");
					// Numeric input (maximum value)
					if (max && type == "number" && parseInt(val, 10) > max)
						return showError("invalid");
					// Minlength / Maxlength requirements
					if (val.length < minlength)
						return showError("invalid");
					if (maxlength && val.length > maxlength)
						return showError("invalid");
					// rel="" Attribute matching, useful for password confirmation
					if (rel.length) {
						log("rel: " + rel);
						var relEl = $("[name='" + rel + "']", $el.get(0).form);
						log("relEl.length: " + relEl.length);
						if (relEl.length && val !== relEl.val())
							return showError("invalid");
					}
					// RegExp
					if (pat.length)
						return validate(pat, this);
					// Test for special input types / predefined formats
					if (typeof $el.attr("type") !== "undefined") {
						var typeMatch = null;
						if (typeMatch = $el.attr("type").match(/(email|url)/)) {
							if (opts.patterns[typeMatch[1]])
								return validate(opts.patterns[typeMatch[1]], this);
						}
					}
					return showSuccess();
				}
				return showError("required");
			}

			function validate(pat, el) {
				$el = (typeof el  !== "undefined") ? $(el) : $(this);
				pat = (typeof pat !== "undefined") ? pat   : $el.attr("pattern");

				var val = $el.val(),
					matches = val.match(pat);

				// Match custom RegExp or display validation message for invalid field
				if (!matches)
					return showError("invalid");
				
				// Cleanup input
				if (matches[1])
					$el.val(matches[1]);
				return showSuccess();
			}

			function getMessage(type) {
				var msg = $el.attr("data-" + type) ? $el.attr("data-" + type) : "";
				return msg.length ? msg : opts[type + "Msg"];
			}

			function removeFormat() {
				$el.closest('.control-group').find('span.error, span.success').remove();
				$el.closest('.control-group').removeClass('error').removeClass('success');
			}
			
			function markup(msg, cssClass) {
				var icons = {
					'error' 	: 'icon-exclamation-sign',
					'success'	: 'icon-ok-sign'
				},  icon = icons[cssClass],
					str = ' <span class="help-inline ' + cssClass + '">' + (opts.icons ? '<i class="' + icon + '"></i>&nbsp;&nbsp;' : '') + msg + '</span>';
				removeFormat();
				$el.closest('.control-group').addClass(cssClass);
				return $el.closest('.controls').append(str);
			}

			function showError(type) {
				var msg = getMessage(type);
				if (opts.errorFunction && typeof opts.errorFunction == "function")
					return opts.errorFunction(msg, $el);
				var cssClass = 'error';
				return markup(msg, cssClass) && 0;
			}

			function showSuccess() {
				var msg = getMessage("success");
				if (opts.successFunction && typeof opts.successFunction == "function")
					return opts.successFunction(msg, $el);
				var cssClass = "success";
				return markup(msg, cssClass) || 1;
			}

			// Validate on events: onBlur, onClick, onChange etc.
			(function bindEvents() {
				if (opts.live) {
					$reqs.on("blur", requireListener);
					$reqs.on("change", requireListener);
					$reqs.filter(":checkbox, :radio").on("click", requireListener);
					$reqs.filter("select").on("change", requireListener);
					$reqs.filter(":hidden").each(function() {
						var hiddenInput = this;
						var cb = function() {
							require(hiddenInput);
						}, name = $(this).attr("name");
						$("[name^='" + name + "']", this.form).on("click", cb);
					});
				}
				$(this).submit(function() {
					var ret = false;
					try {
						ret = validateAll();
					} catch (err) {
						if (window.console)
							console.log(err);
					} finally {
						return ret;
					}
				});
			})();
		});
	}

	$(function() {
		// Skip <form novalidate>
		// Example: $("form:not([novalidate])").invalidate();
		$("form").invalidate();
		
	});
}(window.jQuery));