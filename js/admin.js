function AdminCtrl($scope){
    $scope.subjects = [];
    $scope.tags = [];
	$scope.newSubject = {
		Name: '',
		Description: '',
		Depends: [],
		Provides: [],
        clear: function() {
            this.Name = '';
            this.Description = '';
            this.Depends.length = 0;
            this.Provides.length = 0;
        }
	}

    $scope.getAllSubjects = function() {
        $.ajax({
            url: 'https://api.everlive.com/v1/RhGb6ryktMNcAwj9/Subject',
            type: "GET",
			dataType: 'json',
            success: function(data) {
				$scope.$apply(function() {
					var parsedData = data;
					var subjects = parsedData.Result;

                    var allProvides = _.union.apply(this, _.pluck(subjects, 'Provides'));
                    var allDepends = _.union.apply(this, _.pluck(subjects, 'Depends'));
                    $scope.tags = _.compact(_.union(allProvides, allDepends));
				});

            },
            error: function(error){
                //alert(JSON.stringify(error));
            }
        });
    };
	
	$scope.submitNewSubject = function() {
        var serializedData = JSON.stringify($scope.newSubject);

        $.ajax({
            url: 'https://api.everlive.com/v1/RhGb6ryktMNcAwj9/Subject',
            type: "POST",
            headers: {'Authorization' : 'Bearer mJlsvlyBjo1NFJo1I5tEoub9x1Zdan7w'},
            contentType: "application/json",
            data: serializedData,
            success: function(data) {
				alert('Added new subject: ' + JSON.stringify(data));
            },
            error: function(error){
                alert('Unable to submit subject; error: ' + JSON.stringify(error));
            }
        });
        $scope.newSubject.clear();
        $( "#provides, #depends" ).val('');
	};

	function splitAndTrim( val ) {
		return _.compact(val.replace(/^\s\s*/, '').replace(/\s\s*$/, '').split( /,\s*/ ));
	};
	function extractLast( term ) {
		return splitAndTrim( term ).pop();
	};
	function selectTags(event, ui) {
		if(!$.data(this, 'dirty'))
			return;
		var terms = splitAndTrim( this.value );
		// remove the current input
		terms.pop();
		// add the selected item
		terms.push( ui.item.value );

		$(this).data('bound-array').length = 0;
		$.extend(true, $(this).data('bound-array'), terms.slice());

		// add placeholder to get the comma-and-space at the end
		terms.push( "" );
		this.value = terms.join( ", " );
		
		$.data(this, 'dirty', false);
		return false;
	}
	function typeTags(event, ui) {
		if(!$.data(this, 'dirty'))
			return;
		var terms = splitAndTrim( this.value );

		$(this).data('bound-array').length = 0;
		$.extend(true, $(this).data('bound-array'), terms.slice());

		// add placeholder to get the comma-and-space at the end
		terms.push( "" );
		this.value = terms.join( ", " );
														
		$.data(this, 'dirty', false);
		return false;
	}

	$( "#provides" ).data('bound-array', $scope.newSubject.Provides);
	$( "#depends" ).data('bound-array', $scope.newSubject.Depends);
	
	$( ".tags" ).data('dirty', false)
	// don't navigate away from the field on tab when selecting an item
	.bind( "keydown", function( event ) {
		if ( event.keyCode === $.ui.keyCode.TAB &&
			$( this ).data( "ui-autocomplete" ).menu.active ) {
			event.preventDefault();
		}
	})
	.autocomplete({
		source: function( request, response ) {
			// delegate back to autocomplete, but extract the last term
			response( $.ui.autocomplete.filter(
			$scope.tags, extractLast( request.term ) ) );
		},
		focus: function() {
			// prevent value inserted on focus
			return false;
		},
		select: selectTags,
		change: typeTags,
		search: function( event, ui ) {
			$.data(this, 'dirty', true);
		}
	});

    $scope.getAllSubjects();
}
