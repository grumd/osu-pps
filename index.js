var originalData = [];
var data = [];
var showCount = 20;
var loadingMessageUpdate;
var overweightnessMode = 'age';

// on start
var cookies = document.cookie.split(';');
var cookie = cookies.find(cookie => cookie.includes('osupps_overweightnessmode'));
if (cookie) {
	overweightnessMode = cookie.split('=')[1];
}
$(document).ready(function() {
	$('#overweightness').val(overweightnessMode).change();
});

function truncateFloat(number) {
  return Math.round(number * 100) / 100;
}
function secondsToFormatted(length) {
  return `${Math.floor(length / 60)}:${('0' + (length % 60)).slice(-2)}`;
}
function formattedToSeconds(minutes, seconds) {
  return minutes * 60 + seconds;
}
function modAllowed(selectValue, hasMod) {
  return !['yes', 'no'].includes(selectValue) || (selectValue === 'yes' && hasMod) || (selectValue === 'no' && !hasMod);
}
function matchesMaxMin(value, min, max) {
  return value >= min && value <= max;
}
function sortOriginalData() {
	var overweightnessSorter = {
		age: (a, b) => b.x / b.h - a.x / a.h,
		total: (a, b) => b.x - a.x,
		playcount: (a, b) => b.x / b.p - a.x / a.p,
	}[overweightnessMode];
	data = originalData.sort(overweightnessSorter);
}
function onChangeOverweightness(event) {
	overweightnessMode = event.target.value;
	document.cookie = "osupps_overweightnessmode=" + overweightnessMode + "; path=/";
	sortOriginalData();
	applyFilters();
}
function filterData(rawData) {
  var searchText = $('#search').val() || '';
  var pp = {
    min: parseFloat($('#pp-min').val()) || 0,
    max: parseFloat($('#pp-max').val()) || 9999,
  };
  var bpm = {
    min: parseFloat($('#bpm-min').val()) || 0,
    max: parseFloat($('#bpm-max').val()) || 9999,
  };
  var diff = {
    min: parseFloat($('#diff-min').val().replace(',', '.')) || 0,
    max: parseFloat($('#diff-max').val().replace(',', '.')) || 9999,
  };
  var length = {
    min: formattedToSeconds(
      parseFloat($('#len-min-min').val()),
      parseFloat($('#len-sec-min').val())
    ),
    max: formattedToSeconds(
      parseFloat($('#len-min-max').val()),
      parseFloat($('#len-sec-max').val())
    ),
  };
  var mods = {
    dt: $('#dt').val(),
    hd: $('#hd').val(),
    hr: $('#hr').val(),
    fl: $('#fl').val(),
  };
  const filteredData = rawData.filter((map) => {
    var mapMods = {
      dt: (map.m & 64) == 64,
      hd: (map.m & 8) == 8,
      hr: (map.m & 16) == 16,
      fl: (map.m & 1024) == 1024,
      ht: (map.m & 256) == 256,
    };

    const realBpm = mapMods.dt ? (map.bpm * 1.5) : mapMods.ht ? (map.bpm * 0.75) : map.bpm;

    var mapLink = `http://osu.ppy.sh/b/${map.b}`;
    var linkText = (`${map.art} - ${map.t} [${map.v}]`).toLowerCase();
    var searchWords = searchText.toLowerCase().split(' ');
    var searchMatches = searchWords.every(word =>
      mapLink.includes(word) || linkText.includes(word)
    );

    return searchMatches
      && matchesMaxMin(map.pp99, pp.min, pp.max)
      && matchesMaxMin(realBpm, bpm.min, bpm.max)
      && matchesMaxMin(map.d, diff.min, diff.max)
      && matchesMaxMin(map.l, length.min, length.max)
      && modAllowed(mods.dt, mapMods.dt)
      && modAllowed(mods.hd, mapMods.hd)
      && modAllowed(mods.hr, mapMods.hr)
      && modAllowed(mods.fl, mapMods.fl)
      && (mods.dt !== 'ht' || mapMods.ht);
  });

  if (filteredData.length === 0) {
    const searchFailed = !rawData.some(map => {
      var mapLink = `http://osu.ppy.sh/b/${map.b}`;
      var linkText = (`${map.art} - ${map.t} [${map.v}]`).toLowerCase();
      var searchWords = searchText.toLowerCase().split(' ');
      var searchMatches = searchWords.every(word =>
        mapLink.includes(word) || linkText.includes(word)
      );
    });
    if (searchFailed) {
      $('.search-control').addClass('has-error');
    }
  }
  return filteredData;
}
function updateTable() {
  $('.search-control').removeClass('has-error');
  var tableBody = $('#table-body');
  tableBody.empty();

  var filteredData = filterData(data);

  $.each(filteredData.slice(0, showCount), function(index, value) {
    var okGlyph = '<span class="glyphicon glyphicon-ok"></span>';
    var htGlyph = '<span class="glyphicon glyphicon-time"></span>';
    var mods = {
      dt: (value.m & 64) == 64,
      hd: (value.m & 8) == 8,
      hr: (value.m & 16) == 16,
      fl: (value.m & 1024) == 1024,
      ht: (value.m & 256) == 256,
    };
    var mapLink = `http://osu.ppy.sh/b/${value.b}`;
    var linkText = value.art ? `${value.art} - ${value.t} [${value.v}]` : mapLink;

    var bpm = mods.dt
      ? `<span class="bpm fast">${truncateFloat(value.bpm * 1.5)}</span>(${truncateFloat(value.bpm)})`
      : mods.ht
      ? `<span class="bpm slow">${truncateFloat(value.bpm * 0.75)}</span>(${truncateFloat(value.bpm)})`
      : truncateFloat(value.bpm);

    var row = $('<tr></tr>');
    row.append($(`<td class="img-td"><img src="https://b.ppy.sh/thumb/${value.s}.jpg" /></td>`));
    row.append($('<td></td>').append($('<a></a>').attr('href', mapLink).text(linkText)));
    row.append($('<td class="text-center"></td>').text((+value.pp99).toFixed(0)));
    row.append($('<td class="text-center"></td>').append(mods.ht ? $(htGlyph) : mods.dt ? $(okGlyph) : null));
    row.append($('<td class="text-center"></td>').append(mods.hd ? $(okGlyph) : null));
    row.append($('<td class="text-center"></td>').append(mods.hr ? $(okGlyph) : null));
    row.append($('<td class="text-center"></td>').append(mods.fl ? $(okGlyph) : null));
    row.append($('<td class="text-center"></td>').text(secondsToFormatted(value.l)));
    row.append($('<td class="text-center"></td>').append(bpm));
    row.append($('<td class="text-center"></td>').text(value.d));
	var overweightnessValue = {
		age: (+value.x/+value.h*20000).toFixed(0),
		total: (+value.x).toFixed(0),
		playcount: (+value.x/+value.p*300000).toFixed(0),
	}[overweightnessMode];
    row.append($('<td class="text-center"></td>').text(overweightnessValue));
    tableBody.append(row);
  });
  $('#show-more-div').empty();
  if (filteredData.length > 0 && showCount < filteredData.length) {
    $('#show-more-div').append($('<button onclick="showMore()" class="btn btn-success show-more-btn">show more</button>'));
  }
  // if (filteredData.length === 0) {
  //   $('#show-more-div').text('nothing to show, sorry');
  // }
}
function showMore() {
  showCount += 20;
  updateTable();
}
function applyFilters() {
  showCount = 20;
  updateTable();
}
$(document).ready(function() {
  loadingMessageUpdate = setTimeout(function() {
    $('#loading').text('loading... it can take a minute');
  }, 3000);
  $.ajax({
    dataType: 'json',
    url: 'https://raw.githubusercontent.com/grumd/osu-pps/master/metadata.json',
    success: function(rawData) {
      $('#last-update').text('last updated: ' + new Date(rawData.lastUpdated).toLocaleDateString());
    },
    error: function() {
      $('#last-update').text('error!');
    },
    timeout: 0,
  });
  $.ajax({
    dataType: 'json',
    url: 'https://raw.githubusercontent.com/grumd/osu-pps/master/data.json',
    success: function(rawData) {
      $('#loading').remove();
		  originalData = rawData;
			sortOriginalData();
      updateTable();
    },
    error: function(jqXHR, textStatus, errorThrown) {
      $('#loading').text('error! ' + errorThrown);
    },
    complete: function() {
      clearTimeout(loadingMessageUpdate);
    },
    timeout: 0,
  });
  $('input.minute').change(function(event) {
    if (event.target.value > 99) {
      event.target.value = 99;
    }
    if (event.target.value < 0 || !event.target.value) {
      event.target.value = 0;
    }
  });
  $('input.second').change(function(event) {
    if (event.target.value > 59) {
      event.target.value = 59;
    }
    if (event.target.value < 0 || !event.target.value) {
      event.target.value = 0;
    }
    if (event.target.value < 10) {
      event.target.value = '0' + event.target.value;
    }
  });
});
