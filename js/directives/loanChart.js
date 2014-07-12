'use strict';

angular.module('shovel')
    .directive('loanChart', function () {

        return {
            restrict: 'E',
            replace : true,
            template: '<div class="loan-chart"></div>',
            scope   : {
                loans: '='
            },
            link    : function (scope, element) {
                var width = element.innerWidth() - 50,
                    height = 200;

                var container = d3.select(element[0])
                        .append('svg')
                        .attr('xmlns', 'http://www.w3.org/2000/svg')
                        .attr('version', '1.1')
                        .attr('height', height + 50),
                    svg = container
                        .append('g')
                        .attr('transform', 'translate(' + 50 + ',' + 25 + ')');

                var x = d3.time.scale()
                        .range([0, width]),
                    y = d3.scale.linear()
                        .range([height, 0]);

                var xAxis = d3.svg.axis()
                        .scale(x)
                        .orient('bottom'),
                    yAxis = d3.svg.axis()
                        .scale(y)
                        .orient('left'),
                    line = d3.svg.line()
                        .x(function(d) { return x(d.date); })
                        .y(function(d) { return y(d.balance); });

                svg.append('g')
                    .attr('class', 'x axis')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(xAxis);

                svg.append('g')
                    .attr('class', 'y axis')
                    .call(yAxis)
                    .append('text')
                    .attr('transform', 'rotate(-90)')
                    .attr('y', 6)
                    .attr('dy', '.71em')
                    .style('text-anchor', 'end')
                    .text('Balance ($)');

                scope.$watch('loans', function (){
                    if (scope.loans && scope.loans.length > 0) {
                        redraw();
                    }
                });

                function redraw() {
                    var parseDate = d3.time.format('%b %Y').parse,
                        data = _.map(scope.loans, function (loan) {
                        return _.map(loan.payments, function (payment) {
                            payment.date = parseDate(payment.date);
                            return payment;
                        });
                    });

                    var maxBalance = d3.max(data, function(d) { return d3.max(d, function (p) { return p.balance; }); }),
                        minBalance = d3.min(data, function(d) { return d3.min(d, function (p) { return p.balance; }); }),
                        maxDate = d3.max(data, function(d) { return d3.max(d, function (p) { return p.date; }); }),
                        minDate = d3.min(data, function(d) { return d3.min(d, function (p) { return p.date; }); });

                    x.domain([minDate, maxDate]);
                    y.domain([minBalance, maxBalance]);

                    var lines = svg.selectAll('.line')
                        .data(data);

                    lines.enter()
                        .call(enterLine);

                    lines
                        .call(updateLines);

                    lines.exit()
                        .transition()
                        .style('opacity', 0)
                        .remove();

                    svg.select('.x.axis')
                        .transition()
                        .duration(500)
                        .call(xAxis);

                    svg.select('.y.axis')
                        .transition()
                        .duration(500)
                        .call(yAxis);
                }

                function enterLine(newLine) {
                    newLine.append('path')
                        .attr('class', 'line')
                        .attr('d', line);
                }

                function updateLines(lines) {
                    lines.transition()
                        .duration(500)
                        .attr('d', line);
                }

            }
        };

    });
