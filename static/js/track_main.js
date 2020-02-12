$(document).ready(function () {
    let namespace = '/track';
    let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);
    let pos_data = {};
    $('.fixed-action-btn').floatingActionButton();
    let start = $('#start');
// Give the points a 3D feel by adding a radial gradient
    Highcharts.setOptions({
        colors: Highcharts.getOptions().colors.map(function (color) {
            return {
                radialGradient: {
                    cx: 0.4,
                    cy: 0.3,
                    r: 0.5
                },
                stops: [
                    [0, color],
                    [1, Highcharts.color(color).brighten(-0.2).get('rgb')]
                ]
            };
        })
    });
    //init side nav
    $(document).ready(function () {
        $('.sidenav').sidenav();
    });


// Set up the chart
    chart = new Highcharts.Chart({
        chart: {
            renderTo: 'container',
            margin: 100,
            type: 'scatter3d',
            animation: true,
            options3d: {
                enabled: true,
                alpha: 10,
                beta: 100,
                depth: 500, //the depth, makes square like
                viewDistance: 10,
                fitToPlot: false,
                frame: {
                    bottom: {size: 1, color: 'rgba(0,0,0,0.02)'},
                    back: {size: 1, color: 'rgba(0,0,0,0.04)'},
                    side: {size: 1, color: 'rgba(0,0,0,0.06)'}
                }
            }
        },
             credits: {
                enabled: false
            },
        title: {
            text: 'Track your position'
        },
        // subtitle: {
        //         //     text: 'Click and drag the plot area to rotate in space'
        //         // },
        plotOptions: {
            scatter: {
                width: 10,
                height: 8,
                depth: 7
            },
        },
        yAxis: {
            min: 0,
            max: 50,
            title: 'height',
            tickInterval: 5
        },
        xAxis: {
            min: 0,
            max: 50,
            title: 'x-->',
            gridLineWidth: 1,
            tickInterval: 5
        },
        zAxis: {
            min: 0,
            max: 50,
            title: 'y-->',
            showFirstLabel: false,
            tickInterval: 5
        },
        legend: {
            enabled: false
        },
        series: [{
            name: 'ANCHOR',
            color:'red',
            colorByPoint: false,
            marker: {
            symbol: 'square'
        },
            accessibility: {
                exposeAsGroupOnly: true
            },
            tooltip: {
                enabled: true,
                useHTML: true,
                pointFormatter: function () {
                    return "<b>" + this.name + "</b><br><b>" + this.x + ", " + this.y + " ,"+this.y+" cms</b>";
                }
            },
            data: [
                // [1, 6, 5], [8, 7, 9], [1, 3, 4], [4, 6, 8], [5, 7, 7], [6, 9, 6]
            ]
        },
            {
                name: 'TAG',
                colorByPoint: true,
                accessibility: {
                    exposeAsGroupOnly: true
                },

                dataLabels: {
                    align: 'top',
                    enabled: true,
                    useHTML: true,
                    formatter: function () {
                        // const icon = '<i class="fa fa-bolt" aria-hidden="true"></i>';
                        // return `${icon} ${this.point.name}`;
                        return "<b>" + this.point.name + "</b>";
                    }
                },
                 tooltip: {
                enabled: false,
      pointFormatter: function() {
        return ""
      }},
                marker: {
                    symbol: 'url(/static/map_icn.png)'
                },
                data: [
                    // [1, 6, 5], [8, 7, 9], [1, 3, 4], [4, 6, 8], [5, 7, 7], [6, 9, 6]
                ]
            }]
    });


// Add mouse and touch events for rotation
    (function (H) {
        function dragStart(eStart) {
            eStart = chart.pointer.normalize(eStart);

            var posX = eStart.chartX,
                posY = eStart.chartY,
                alpha = chart.options.chart.options3d.alpha,
                beta = chart.options.chart.options3d.beta,
                sensitivity = 5,  // lower is more sensitive
                handlers = [];

            function drag(e) {
                // Get e.chartX and e.chartY
                e = chart.pointer.normalize(e);

                chart.update({
                    chart: {
                        options3d: {
                            alpha: alpha + (e.chartY - posY) / sensitivity,
                            beta: beta + (posX - e.chartX) / sensitivity
                        }
                    }
                }, undefined, undefined, false);
            }

            function unbindAll() {
                handlers.forEach(function (unbind) {
                    if (unbind) {
                        unbind();
                    }
                });
                handlers.length = 0;
            }

            handlers.push(H.addEvent(document, 'mousemove', drag));
            handlers.push(H.addEvent(document, 'touchmove', drag));


            handlers.push(H.addEvent(document, 'mouseup', unbindAll));
            handlers.push(H.addEvent(document, 'touchend', unbindAll));
        }

        H.addEvent(chart.container, 'mousedown', dragStart);
        H.addEvent(chart.container, 'touchstart', dragStart);
    }(Highcharts));

   start.click(function () {
       if(start.text() === 'play_arrow')
           start.text('stop');
       else
           start.text('play_arrow');
        send('start_pos', {'dummy_mode': true})
    });
    $('#settings').click(function () {
        $('.sidenav').sidenav('open');
    });

//
    socket.on('connect', function () {
        // we emit a connected message to let knwo the client that we are connected.
        socket.emit('client_msg', {cause: 'connection', details: 'trackyou'});
    });
    socket.on('connection', function (msg) {
        console.log(msg);
        add_anchors(msg.anchor_data);
        // send('connection')

        // we emit a connected message to let know the client that we are connected.
    });

    function send(cause, msg) {
        socket.emit('client_msg', {cause: cause, msg: msg});
    }

    socket.on('server_msg', function (msg) {
        if (msg.cause === 'connection') {
            if (msg.server) {
                console.log(msg.server);
            }
        } else if (msg.cause === 'anchor_data') {
            add_anchors(msg.anchor_data);
        } else if (msg.cause === 'pos_data') {
            update_tag_pos(msg.pos_data);
        }
    });

    function update_tag_pos(pos_obj) {
        console.log(pos_obj[0].x);
        chart.series[1].update({
            data: pos_obj
        }, true);
//        chart.redraw();
//        chart.hideLoading();
    }

    function add_anchors(anc_info) {
        // console.log(anc_info)
        chart.series[0].update({
            data: anc_info
        }, true);
    }
});