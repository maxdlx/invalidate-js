(function($) {
	$.fn.invalidate = function(options) {
		var version = "0.7",
			opts = $.extend({
				'patterns'			: {
					"email" : new RegExp(/\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,6})\b/i), 
					"url"   : new RegExp(/^http:\/\//),
					"number": new RegExp(/\d*/)
				},
				'errorFunction'		: null, /* markup function */
				'successFunction'	: null, /* markup function */
				'submitFunction'	: null, /* markup function */
				'requiredMsg'		: 'Bitte f&uuml;llen Sie das Feld aus!',
				'invalidMsg'		: 'Bitte geben Sie einen g&uuml;ltigen Wert ein!',
				'successMsg'		: 'OK',
				'icons'				: true,
				'live'				: true,
				'verbose'			: true,
				'showPseudoError'	: false
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
			var $el, 
				$form = $(this),
				$reqs = $form.find("[required], [pattern], [minlength], [maxlength], [min], [max], [data-error]");

			function log(msg) {
				if (!window.console || !opts.verbose) 
					return;
				
				if (typeof msg !== "string")
					console.dir(msg);
				else
					console.log(msg);
			}

			function validateAll(startupCall) {
				((!startupCall)?startupCall=false:null);

				var errCount = 0;
				log("validateAll() called");
				$reqs.each(function() {
					if (! require.apply(this,[startupCall]))
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

			function require(initInvalidation) {
				$el = $(this);
				((!initInvalidation)?initInvalidation=false:null);

				var disabled = $el.attr('disabled'),
					readonly = $el.attr('readonly'),
					novalidate = $el.attr('data-novalidate'),
					name = $el.attr('name') + "",
					min = $el.attr('min') ? parseInt($el.attr('min'), 10) : 0,
					max = $el.attr('max') ? parseInt($el.attr('max'), 10) : 0,
					minlength = $el.attr('minlength') ? parseInt($el.attr('minlength'), 10) : 0,
					maxlength = $el.attr('maxlength') ? parseInt($el.attr('maxlength'), 10) : 0,
					pat = $el.attr('pattern') ? $el.attr('pattern') : "",
					rel = $el.attr('rel') ? $el.attr('rel') : "",
					type = $el.attr('type') ? $el.attr('type') : "",
					val = $el.val() ? $.trim($el.val()) : "",
					pseudoError = $el.attr('data-error') ? $el.attr('data-error') : "";

				log("require() called");

				// show pseudoErrors only on init
				if (initInvalidation){
					if (pseudoError && pseudoError.length) {
						return showError("error");
					}
					return log("require() initInvalidation; returnValue: false") && 0;
				}

				if(novalidate){
					return true;
				}
				if (disabled || readonly)
					return log("require() returns; returnValue: false") && 0;

				log("require(): name: " + name);
				log("require(): type: " + type);
				if (name.length && (type == "checkbox" || type == "radio" || type == "hidden")) {
					// Hidden field (useful for multiple checkboxes / radio buttons)
					if (type == "hidden") {
						// hidden field is checked, so its true
						if ($(this).is(":checked") || $(this).is(":selected")){
							return showSuccess();
						}
						var rState = true;
						var rFields = $("[name^='" + name + "']", $el.get(0).form);

						// hidden field is not checked, but the only one, so its false
						if (rFields.length == 1){
							return showError("required");
						}

						// do check for every field
						rFields.each(function(cObj){
							// find others
							if ($el.attr("id") != $(this).attr("id")){
								if ($(this).attr("type") == "radio" || $(this).attr("type") == "checkbox"){
									if ((!$(this).is(":checked")) && (!$(this).is(":selected"))){
										rState = false;
									}
								}else if($(this).val() == ""){
									rState = false;
								}
							}
						});
						log("HIDDEN: "+name+" - > RES: "+rState);
						return ((rState)?showSuccess() : showError("required"));
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
					if (type == "radio" && !$el.is(":checked")){
						showError("required");
						return true;
					}
					// Checkboxes
					if (type == "checkbox" && !$el.is(":checked")){
						showError("required");
						return true;
					}
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
					if (maxlength > 0 && val.length > maxlength)
						return showError("invalid");
					// rel="" Attribute matching, useful for password confirmation
					if (rel.length) {
						log("rel: " + rel);
						var relEl = $("[name='" + rel + "']", $el.get(0).form);
						log("relEl.length: " + relEl.length);
						if (val !== relEl.val())
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
				log("msg: " + msg);
				log("type: " + type);
				return msg && msg.length ? msg : opts[type + "Msg"];
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

			// show pseudoError only on initValidation
			if (opts.showPseudoError){
				validateAll(true);
			}

			// Validate on events: onBlur, onClick, onChange etc.
			(function bindEvents() {
				if (opts.live) {
					$reqs.bind("blur", requireListener);
					$reqs.bind("change", requireListener);
					$reqs.filter(":checkbox, :radio").bind("click", requireListener);
					$reqs.filter("select").bind("change", requireListener);
					$reqs.filter(":hidden").each(function() {
						var hiddenInput = this;
						var cb = function() {
							require.apply(hiddenInput);
						}, name = $(this).attr("name");
						$("[name^='" + name + "']", this.form).bind("click", cb);
					});
				}

				var callback = function() {
					var ret = false;
					try {
						ret = validateAll();
					} catch (err) {
						if (window.console)
							console.log(err);
					} finally {
						if (opts.submitFunction && typeof opts.submitFunction == "function"){
							return opts.submitFunction(ret,$form);
							//ret = opts.submitFunction(ret,$form);
						}
						return ret;
					}
				};
				
				// Example:
				// $("form").trigger("invalidate");
				$form.bind("invalidate", callback);
				$form.submit(callback);
			})();
		});
	}

	// $(function() {
		// Example: $("form:not([novalidate])").invalidate();
		// $("form").invalidate();
	// });
}(window.jQuery));