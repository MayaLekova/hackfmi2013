$(document).ready(function(){
     sys = arbor.ParticleSystem(1000, 400,1);
     sys.renderer = Renderer('#viewport');
     sys.parameters({gravity : true});
	 $('#SelectedSubject').hide();
});


function can_be_used_by(x, y){
    /* determines if knowledge from subject x can be used by
       other subject y
       (when x provides a tag on which y depends)
    */
    provides_length = (x.Provides ? x.Provides.length : 0);
    depends_length = (y.Depends ? y.Depends.length : 0);
    for(var d = 0; d < provides_length;d++){
        for(var e = 0;e < depends_length;e++){
            if(x.Provides[d] == y.Depends[e]){
                return true;
            }
        }
    }
}


loading = false;

function ClearNodes(){
	var nodes = [];
	sys.eachNode(function(node){nodes.push(node);});
	for (i = 0; i < nodes.length; i++){
		sys.pruneNode(nodes[i]);
	}
	selected = undefined;
}

function FairyCtrl($scope){
    $scope.subjects = [];
    $scope.edges = [];
    g_subjects = {};
	g_nodes = {};
	$scope.aliases = [];
	$scope.majors = [];

    $scope.getMajor = function(major) {
        // deprecated
    	// var filter = { "Name" : major };

        $scope.edges = [];
        $scope.subjects = [];

		$.ajax({
            url: 'https://brilliant-fire-3083.firebaseio.com/Major.json',
            type: "GET",
			dataType: 'json',
            success: function(data){
				var parsedData = {};
                for(var i = 0; i < data.Result.length; i++) {
                    if(data.Result[i].Name != major) continue;
                    parsedData = data.Result[i];
                }

                for(var i = 0; i < parsedData.Subjects.length; i++){
                    $scope.subjects.push(parsedData.Subjects[i]);
                }
                loading = false;
                $scope.getAliases(major);
                
            },
            error: function(error){
                alert(JSON.stringify(error));
            }
        });
    };

    $scope.getAliases = function(major) {
        // deprecated
		// var filter = { "Major" : major };

		$scope.aliases = [];
		$.ajax({
            url: 'https://brilliant-fire-3083.firebaseio.com/Alias.json',
            type: "GET",
			dataType: 'json',
            success: function(data){
                var parsedData = data.Result;
				for(i = 0; i < parsedData.length; i++){
                    var alias = parsedData[i];
                    if(alias.Major != major) continue;
					$scope.aliases.push(alias);
                }

				$scope.getSubjects();
            },
            error: function(error){
                //alert(JSON.stringify(error));
            }
        });
    };

    $scope.getAllMajors = function() {
        $.ajax({
            url: 'https://brilliant-fire-3083.firebaseio.com/Major.json',
            type: "GET",
			dataType: 'json',
            success: function(data) {
				$scope.$apply(function() {
					//var parsedData = $.parseJSON(data);
					var parsedData = data;
					var majors = parsedData.Result;

					for(var i = 0; i < majors.length; i++){
						$scope.majors.push(majors[i]);
					}
				});
            },
            error: function(error){
                //alert(JSON.stringify(error));
            }
        });
    };

	$scope.getSubjects = function() {

        // deprecated
        // var filter = { "Name" : { "$in" : $scope.subjects } };

        $.ajax({
            url: 'https://brilliant-fire-3083.firebaseio.com/Subject.json',
            type: "GET",
			dataType: 'json',
            success: function(data){

				var parsedData = data;
                var subjects = parsedData.Result; //[0].Subjects;

				ClearNodes();

				for(var i = 0; i < subjects.length;i++) {
					for(var j=0; j < $scope.aliases.length; j++){

                    	if (subjects[i].Name == $scope.aliases[j].Subject) {
							subjects[i].Name = $scope.aliases[j].Name;
							break;
						}
					}

                    var found = -1;
                    for(var j = 0; j < $scope.subjects.length; j++) {
                        if($scope.subjects[j] == subjects[i].Name) {
                            found = j;
                            break;
                        }
                    }
                    if(found < 0) continue;

                    $scope.subjects[found] = subjects[i];
                }

                for(var i = 0; i < $scope.subjects.length; i++) {
                    g_nodes[$scope.subjects[i].Name] = sys.addNode(
                        $scope.subjects[i].Name,
                        {'label' : $scope.subjects[i].Name});
                    g_subjects[$scope.subjects[i].Name] = $scope.subjects[i];

                    for(var j = i + 1;j < $scope.subjects.length;j++){

                        if(can_be_used_by($scope.subjects[i], $scope.subjects[j])){
                            $scope.edges.push([$scope.subjects[i], $scope.subjects[j], $scope.subjects[i]]);
                        }
                        if(can_be_used_by($scope.subjects[j], $scope.subjects[i])){
                            $scope.edges.push([$scope.subjects[j], $scope.subjects[i], $scope.subjects[j]]);
                        }
                    }                    
                }

                $scope.drawEdges();
            },
            error: function(error){
                //alert(JSON.stringify(error));
            }
        });
    };

    $scope.drawEdges = function() {
        for(var d = 0;d < $scope.edges.length;d++){
            var newEdge = sys.addEdge(
                g_nodes[$scope.edges[d][0].Name],
                g_nodes[$scope.edges[d][1].Name],
				$scope.edges[d][2].Provides);
			newEdge.color = "rgba(0,0,0, .7)";
			newEdge.lineWidth = 2;
        }
    };

	$scope.getAllMajors();
	maj = document.URL.split('#')[1];
	maj = maj.replace(/(%20)/g, ' ');
	$scope.getMajor(maj);

	$("#Majors1").change(function()
	{
        //console.log('changed');
        var major = $('#Majors1').val();
        if(major != undefined){
			selected = null;
			$('#SelectedSubject').hide();
            loading = true;
            $scope.getMajor($("#Majors1").find(':selected').val());
            window.location.hash = '#' + major.replace(" ", "%20");
        }

	});
	setTimeout(function(){ $("#Majors1").val(maj); }, 1000);

    $(window).bind("hashchange", function (){
        //console.log('hash has changed to' + window.location.hash);
        //escape race conditions?
        if(!loading){
            $('#Majors1').val(window.location.hash.slice(1));
            loading = true;
            $scope.getMajor($("#Majors1").find(':selected').val());			
        }
    });
}
