'use strict';

angular.module('shovel')
    .controller('loansCtrl', function ($scope, PayoffCalculator) {

        $scope.amount = '';
        $scope.paymentType = 'avalanche';
        $scope.loans = [];
        $scope.payments = [];

        $scope.removeLoan = function (index) {
            $scope.loans.splice(index, 1);
        };

        $scope.addLoan = function () {
            $scope.loans.push({ id: _.uniqueId() });
        };

        $scope.$watch('loans', _.debounce(updateCalculations, 750), true);

        function updateCalculations() {
            var loans = _.filter($scope.loans, isLoanFilled),
                totalMinimum;

            if (_.isEmpty(loans)) {
                return;
            } else {
                totalMinimum = _(loans)
                    .map('minimum')
                    .reduce(function (sum, minimum) {
                        return sum + minimum;
                    }, 0);

                if (_.isUndefined($scope.amount) || $scope.amount < totalMinimum) {
                    $scope.amount = totalMinimum;
                }
            }

            PayoffCalculator.calculate(loans, $scope.amount);
        }

        function isLoanFilled(loan) {
            return _(['name', 'balance', 'minimum', 'interest'])
                .map(function (field) {
                    var value = loan[field],
                        isFilled = isFieldFilled(value);

                    if (field === 'name') {
                        return isFilled && !_.isEmpty(value);
                    }

                    return isFilled;
                })
                .all();
        }

        function isFieldFilled(field) {
            return !_.isUndefined(field);
        }

        $scope.addLoan();

    });
