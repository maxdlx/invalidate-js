invalidate-js
===========

HTML(5) Form Validator

Info
====
jQuery-Plugin for HTML Form Validation, including numeric and email types

Installation
===========

    <script type="text/javascript" src="js/jquery.invalidate.js"></script>

Events
======
    `<form>` submit events are registered automatically onDomReady.
    
manual initialization:

```javascript
    $("form").invalidate({
    	... options ...
    });
```
    
Options
=======

```javascript
	{
		'errorFunction'		: null, /* markup function */
		'successFunction'	: null, /* markup function */
		'requiredMsg'		: 'Bitte f&uuml;llen Sie das Feld aus!',
		'invalidMsg'		: 'Bitte geben Sie einen g&uuml;ltigen Wert ein!',
		'successMsg'		: 'OK',
		'icons'				: true,
		'live'				: true
	}
```

Customization
=============
Customizable markup functions:
 - the default implementation relies on twitter/bootstrap structure (`.control-group .error|.success`, `span.help-inline .error|.success`)
 - callback options: `{ successFunction: function() { ... }, errorFunction : function() { ... } }`

Example:

```javascript
    {
      'errorFunction'		: function(msg, $el) {
		    alert(msg);
		    $el.focus();
	    },
	    'successFunction'	: function() {}
    }
```

Requirements
============
jQuery 1.7.2 (current stable - tested)

Features
======== 
Check for equal elements values, useful for password confirmation
 - `input [rel="OTHER_FIELD"]`
 - `input type="[text|password]" [required] [pattern] [minlength] [maxlength] [data-required="Oops! Missing information."] [data-invalid="Invalid information!"]`
 - `input type="number" [required] [pattern] [minlength] [maxlength] [min] [max] [data-required="Text if required field is missing."] [data-invalid="Text if validation fails."]`
 - `input type="checkbox" [required] [data-required="Please read and accept our general terms and conditions to proceed."]`
 - `input type="checkbox" (multiple checkboxes via <input type="hidden" name="NAME_OF_CHECKBOXES" [required] [data-required="Please select at least one option."]>`
 - `input type="radio" (multiple radio buttons via: see above)`
 - `input type="password" [required] [pattern] [minlength] [maxlength] [data-required="Text if required field is missing."] [data-invalid="Text if validation fails."]`
 - `select [required] [pattern] [data-required="Text if required field is missing."] [data-invalid="Text if validation fails."]`
