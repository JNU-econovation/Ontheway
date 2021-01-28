// var recData = [
// 	{
// 		name: '송정 해수욕장',
// 		lat: 0,
// 		lon : 0
// 	},
// 	{
// 		name: '광안리 해수욕장',
// 		lat: 1,
// 		lon: 2
// 	}
// ]

// $.ajax({
// 	method: "GET",
// 	url: "/map",
//     async: true,
//     success: function(response) {
// 		console.log('data: ', response);
//     },
//     error:function(request,status,error){
//         console.log("code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error);
//     }
// })

var markerArr = [];
var infoWindow;

// var map = new kakao.maps.Map(container, options); //지도 생성 및 객체 리턴
var container = document.getElementById('map'); //지도를 담을 영역의 DOM 레퍼런스
// $("#placeul .placeitem #removebtn").click();	
let actualT = getActualTime();
setActualTime(actualT[0], actualT[1]);

// $('input[name=searchbox]').focus(function() {
// 	$("#searchres").show();
// 	// $(this).blur();
// 	// const resDiv = document.getElementById('searchres');
// });

$('input[name=searchbox]').click(function() {
	removeAllChilds();
	$("#searchres").toggle();
});

$('input[name=searchbox]').on("paste keyup click", function() {
	var keyword = $(this).val();

	$("#searchres").hide();

	if (keyword.replace(/^\s+|\s+$/g, "").length == 0) {
		removeAllChilds();
		return;
	}
	else {
		console.log('show_start: ' + keyword);
		$("#searchres").show();
	}
	// tmap api 연결
	// $.ajax({
	// 	method: "GET",
	// 	url: "https://apis.openapi.sk.com/tmap/pois?version=1&format=json&callback=result",
	// 	async: true,
	// 	data: {
	// 		"appKey" : "l7xx314a385b47e74eb58e2bbcac9ebc53e1",
	// 		"searchKeyword" : keyword,
	// 		"resCoordType" : "EPSG3857",
	// 		"reqCoordType" : "WGS84GEO",
	// 		"count" : 10
	// 	},
	// 	success: function(response) {
	// 		let listEl = document.getElementById("searchul");
	// 		removeAllChilds();
			
	// 		try {
	// 			var resultpoisData = response.searchPoiInfo.pois.poi;
	// 			let liFragment = document.createDocumentFragment();

	// 			for (var k in resultpoisData) {
	// 				let name = resultpoisData[k].name;
	// 				let newEl = document.createElement("li");
	// 				newEl.className = "serachitem";
	// 				newEl.innerHTML = name;
	// 				liFragment.appendChild(newEl);	
	// 			}
	
	// 			listEl.appendChild(liFragment);
	// 		} catch {
				
	// 		}

	// 	},
	// 	error:function(request,status,error){
	// 		removeAllChilds();
	// 		console.log("code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error);
	// 	}
	// });
	$.ajax({
		method: "POST",
		url: "/api/search",
		async: true,
		data: {
			"searchKeyword" : keyword,
		},
		success: function(response) {
			let listEl = document.getElementById("searchul");
			removeAllChilds();
			
			try {
				var resultpoisData = response;
				let liFragment = document.createDocumentFragment();

				for (var k in resultpoisData) {
					let name = resultpoisData[k].name;
					var markerPosition = new Tmapv2.LatLng(resultpoisData[k].lat, resultpoisData[k].lon);

					let newEl = document.createElement("li");
					newEl.className = "serachitem";
					newEl.innerHTML = name;
					$(newEl).on("click", function() {
						// addMarker(name, markerPosition, )
					});
					liFragment.appendChild(newEl);	
				}
				
				
				listEl.appendChild(liFragment);
			} catch {
				
			}

		},
		error:function(request,status,error){
			removeAllChilds();
			console.log("code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error);
		}
	});

});

$('#map').click(function() {
	$("#searchres").hide();
	$('input[name=searchbox]').blur();
});

$('input[name=visithour], input[name=visitmin]').each(function() {
	$(this).on("propertychange change keyup paste input", function() {
		let actualT = getActualTime();
		setActualTime(actualT[0], actualT[1]);
	});
});

$('input[name=starthour], input[name=startmin], input[name=endhour], input[name=endmin]').each(function() {
	$(this).on("propertychange change keyup paste input", function() {
		let possibleT = getPossibleTime();
		setPossibleTime(possibleT[0], possibleT[1]);
	});
});

function removeAllChilds() {
	let listEl = document.getElementById("searchul");

	while (listEl.hasChildNodes()) {
		listEl.removeChild(listEl.firstChild);
	}
}

function addRemoveEvent() {
	event.target.closest('li').remove();
	var listUl = document.getElementById('placeul');
	
	if (listUl.childElementCount == 0) {
		let el = document.createElement('li');		
		el.innerHTML = "<span>여행 장소를 선택해주세요.</span>";
		el.id = "emptyli";

		listUl.appendChild(el);

		setActualTime("00", "00");
	}
	else {
		$("#placeul li:nth-child(1)").find('.topborder').toggleClass('topborder').toggleClass('noborder');
		
		let totalH = 0, totalM = 0;
		$('input[name=visithour]').each(function() {
			totalH += Number($(this).val());
		});
		$('input[name=visitmin]').each(function() {
			totalM += Number($(this).val());
		});

		setActualTime(totalH, totalM);
	}
}

function addPlaceListEvent() {
	let listEl = document.getElementById('placeul');

	if (listEl.childElementCount >= 8) {
		alert("일정은 8개 이상 추가할 수 없습니다!");
		return;
	}

	let eventEl = $(event.target).closest('li');
	const placeName = eventEl.children("div").text();
	eventEl.remove();
	
	let listFragment = document.createDocumentFragment();
	let newEl = document.createElement('li');

	if (listEl.firstElementChild.id == "emptyli") {
		listEl.firstElementChild.remove();
		newEl.innerHTML = "<span class='point'>•</span>"
					+ "<div class='iteminfo'>"
					+ 	"<span id='placename' class='placename noborder'>"+placeName+"</span>"
					+	"<div class='visitT noborder'>"
					+ 		"<input type='number' name='visithour' min='0' max='23' value='2'>"
					+       "<span style='padding: 0px 4px;'>시간</span>"
					+       "<input type='number' name='visitmin' min='0' max='59' value='0'>"
					+       "<span style='padding-left: 4px;'>분</span>"
					+	"</div>"
					+	"<span id='removebtn' class='removebtn noborder' onclick='addRemoveEvent()'>x</span>"
					+ "</div>";
	}
	else {
		newEl.innerHTML = "<span class='point'>•</span>"
					+ "<div class='iteminfo'>"
					+ 	"<span id='placename' class='placename topborder'>"+placeName+"</span>"
					+	"<div class='visitT topborder'>"
					+ 		"<input type='number' name='visithour' min='0' max='23' value='2'>"
					+       "<span style='padding: 0px 4px;'>시간</span>"
					+       "<input type='number' name='visitmin' min='0' max='59' value='0'>"
					+       "<span style='padding-left: 4px;'>분</span>"
					+	"</div>"
					+	"<span id='removebtn' class='removebtn topborder' onclick='addRemoveEvent()'>x</span>"
					+ "</div>";
	}
	newEl.className = "placeitem";

	const inputs = newEl.getElementsByTagName("input");
	for (let el of inputs) {
		$(el).on("propertychange change keyup paste input", function() {
			let actualT = getActualTime();
			setActualTime(actualT[0], actualT[1]);
		});
	}
	listFragment.appendChild(newEl);
	listEl.appendChild(listFragment);

	let actualT = getActualTime();
	setActualTime(actualT[0], actualT[1]);
}

// 일정목록 속 총 소요시간
function getActualTime() {
	let totalH = 0, totalM = 0;

	$('input[name=visithour]').each(function() {
		totalH += Number($(this).val());
	});
	$('input[name=visitmin]').each(function() {
		totalM += Number($(this).val());
	});
	
	return [totalH, totalM];
}

// 여행시간 상세설정 -> 총 소요시간 계산
function getPossibleTime() {
	let totalH = Number($('input[name=endhour]').val()) - Number($('input[name=starthour]').val());
	let totalM = Number($('input[name=endmin]').val()) - Number($('input[name=startmin]').val());
	
	return [totalH, totalM];
}

function setActualTime(hour, min) {
	$("#actualT").text("총 소요시간 " + hour + "시간 " + min + "분");
}

function setPossibleTime(hour, min) {
	$("#possibleT").text("총 소요시간 " + hour + "시간 " + min + "분");
}

function addMarker(name, markerPosition, positionBounds) {
	marker = new Tmapv2.Marker({
		position : markerPosition,
		icon : "\../src/pin_orange.png",
		iconSize : new Tmapv2.Size(24, 38),
		title : name,
		map: map
	   });

	markerArr.push(marker);
	positionBounds.extend(markerPosition);	// LatLngBounds의 객체 확장
	
	map.panToBounds(positionBounds);	// 확장된 bounds의 중심으로 이동시키기
	map.setCenter(markerPosition);
	// map.panBy(80, 0);
	map.setZoom(19);
}

function displayInfoWindow(name, address, markerPosition) {
	var content= "<div style='position: static; display: flex; flex-direction: column; font-size: 14px; box-shadow: 5px 5px 5px #00000040; border-radius: 10px; top: 410px; left : 800px; width : 250px; background: #FFFFFF 0% 0% no-repeat padding-box;'>"+
					"<div class='img-box' style='position: relative; width: 100%; height: 150px; border-radius: 10px 10px 0 0 ; background: url(../src/pin_yellow.png) no-repeat center;'></div>"+
					"<div class='info-box' style='padding: 10px;'>"+
						"<p style='margin-bottom: 7px; overflow: hidden;'>"+
							"<span class='tit' style=' font-size: 16px; font-weight: bold;'>"+name+"</span>"+
						"</p>"+
						"<ul class='ul-info'>"+
							"<li class='li-addr' style='padding-left: 20px; margin-bottom: 5px; no-repeat top 3px left;outline: none;'>"+
								"<p class='new-addr'>"+address+"</p>"+
							"</li>"+
						"</ul>"+
					"</div>"+
				"</div>";
		if (infoWindow) {
			infoWindow.setVisible(false);
		}
		//Popup 객체 생성.
		infoWindow = new Tmapv2.InfoWindow({
			position: markerPosition, //Popup 이 표출될 맵 좌표
			border :'0px solid #FF0000', //Popup의 테두리 border 설정.
			content: content, //Popup 표시될 text
			type: 2, //Popup의 type 설정.
			map: map //Popup이 표시될 맵 객체
		});
}

function removeMarker() {
	// 기존 마커, 팝업 제거
	if(markerArr.length > 0){
		for(var i in markerArr){
			markerArr[i].setMap(null);
		}
	}
}