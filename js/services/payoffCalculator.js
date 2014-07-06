'use strict';

angular.module('shovel')
    .factory('PayoffCalculator', function () {

        function calculate(startingLoans, basePayment) {
            var payoffDate = moment(),
                payoffLimit = moment().add('years', 100),
                payments = {},
                loans = angular.copy(startingLoans),
                monthlyMinimum = _.reduce(loans, function (sum, loan) {
                    return sum + loan.minimum;
                }, 0),
                hasRemainingLoans = true,
                remainingPayment = subtract(basePayment, monthlyMinimum),
                minimumPayments = [];

            while(hasRemainingLoans) {
                minimumPayments = payMonthlyMinimums(loans, payoffDate);
                payRemaining(remainingPayment, loans, minimumPayments);
                appendPayments(payments, minimumPayments);

                hasRemainingLoans = !_.all(loans, { balance: 0 });
                payoffDate.add('months', 1);
                console.warn(payoffDate.format('l'));

                if (payoffDate.isAfter(payoffLimit)) {
                    hasRemainingLoans = false;
                }
            }

            console.warn('debt free by ' + payoffDate.format('l'));
            console.dir(payments);

            return payments;
        }

        /**
         * Adds the current months' payments to the historical payments.
         *
         * @param allPayments {array}
         * @param currentPayments {array}
         */
        function appendPayments(allPayments, currentPayments) {
            _.forEach(currentPayments, function (payment, id) {
                if (!_.has(allPayments, id)) {
                    allPayments[id] = [];
                }
                allPayments[id] = allPayments[id].concat(payment);
            });
        }

        /**
         * Allocate the remaining available money to the other loans in order.
         *
         * @param remainingPayment {decimal}
         * @param loans {array}
         * @param minimumPayments {array}
         */
        function payRemaining(remainingPayment, loans, minimumPayments) {
            var completedLoans = _.filter(loans, { balance: 0 }),
                additionalPayment = _.reduce(completedLoans, function (sum, loan) {
                    return sum + loan.minimum;
                }, 0),
                focusLoan = _.last(loans, function (loan) {
                    return loan.balance > 0;
                })[0],
                focusPayment;

            remainingPayment = add(remainingPayment, additionalPayment);

            while (remainingPayment > 0 && focusLoan) {
                if (focusLoan) {
                    focusPayment = Math.min(focusLoan.balance, remainingPayment);
                    focusLoan.balance = subtract(focusLoan.balance, focusPayment);
                    remainingPayment = subtract(remainingPayment, focusPayment);

                    minimumPayments[focusLoan.id].principal = add(minimumPayments[focusLoan.id].principal, focusPayment);
                    minimumPayments[focusLoan.id].balance = subtract(minimumPayments[focusLoan.id].balance, focusPayment);
                    minimumPayments[focusLoan.id].payment = add(minimumPayments[focusLoan.id].principal, minimumPayments[focusLoan.id].interest);
                }

                focusLoan = _.last(loans, function (loan) {
                    return loan.balance > 0;
                })[0];
            }
        }

        /**
         * Reduces each loan by their minimum payments.
         *
         * @param loans {array}
         * @returns {{}}
         */
        function payMonthlyMinimums(loans, month) {
            var remainingLoans = _.reject(loans, { balance: 0 }),
                payments = {};

            _.forEach(remainingLoans, function (loan) {
                var interestPayment = calculateInterestPayment(loan.balance, loan.interest),
                    payment = +Math.min(add(loan.balance, interestPayment), loan.minimum).toFixed(2),
                    principal = subtract(payment, interestPayment),
                    newBalance = Math.max(subtract(loan.balance, principal), 0);

                payments[loan.id] = {
                    date: month.format('MMM YYYY'),
                    payment: payment,
                    principal: principal,
                    interest: interestPayment,
                    balance: newBalance
                };

                loan.balance = newBalance;
            });

            return payments;
        }

        /**
         * Calculates the interest payment for the balance.
         *
         * @param balance
         * @param interest
         * @returns {number}
         */
        function calculateInterestPayment(balance, interest) {
            var monthlyInterest = interest / 100 / 12;
            return +((balance * monthlyInterest).toFixed(2));
        }

        function add(value1, value2) {
            return round(value1, value2, addOperation);
        }

        function subtract(value1, value2) {
            return round(value1, value2, subtractOperation);
        }

        function round(value1, value2, operation) {
            return Math.round(operation(value1 * 100, value2 * 100)) / 100;
        }

        function addOperation(value1, value2) {
            return value1 + value2;
        }

        function subtractOperation(value1, value2) {
            return value1 - value2;
        }

        return {
            calculate: calculate
        };

    });
