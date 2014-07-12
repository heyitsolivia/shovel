'use strict';

angular.module('shovel')
    .controller('loansCtrl', function ($scope, PayoffCalculator) {

        var debouncedCalculate = _.debounce(updateCalculations, 750);

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

        $scope.$watchCollection('[paymentType, amount]', debouncedCalculate);
        $scope.$watch('loans', debouncedCalculate, true);

        function updateCalculations() {
            var loans = _.filter($scope.loans, isLoanFilled),
                sortedLoans,
                totalMinimum,
                payments;

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

            sortedLoans = $scope.paymentType === 'avalanche' ?
                _(loans).sortBy('interest').reverse().value() :
                _.sortBy(loans, 'balance');

            $scope.payments = PayoffCalculator.calculate(sortedLoans, $scope.amount);

            $scope.$apply();
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
        $scope.loans[0].name = 'something';
        $scope.loans[0].balance = 3092.39;
        $scope.loans[0].minimum = 40.41;
        $scope.loans[0].interest = 6.55;
    });
