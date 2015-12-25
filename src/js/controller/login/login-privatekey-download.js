'use strict';

var LoginPrivateKeyDownloadCtrl = function($scope, $location, $routeParams, $q, auth, email, privateKey, keychain) {
    !$routeParams.dev && !auth.isInitialized() && $location.path('/'); // init app

    //
    // scope functions
    //

    /**
     * Download a synced key and decrypt it.
     */
    $scope.checkCode = function() {
        if ($scope.form.$invalid) {
            $scope.errMsg = 'Please fill out all required fields!';
            return;
        }

        var cachedKeypair;

        return $q(function(resolve) {
            $scope.busy = true;
            $scope.errMsg = undefined;
            resolve();

        }).then(function() {
            // login to imap
            return privateKey.init();

        }).then(function() {
            // remember for storage later
            return privateKey.download();

        }).then(function(encryptedKey) {
            // set decryption code
            encryptedKey.code = $scope.code.toUpperCase();
            // decrypt the downloaded encrypted private key
            return privateKey.decrypt(encryptedKey);

        }).then(function(keypair) {
            cachedKeypair = keypair;
            // store the decrypted private key locally
            return keychain.putUserKeyPair(cachedKeypair);

        }).then(function() {
            // try empty passphrase
            return email.unlock({
                keypair: cachedKeypair,
                passphrase: undefined
            }).catch(function(err) {
                // passphrase incorrct ... go to passphrase login screen
                $scope.goTo('/login-existing');
                throw err;
            });

        }).then(function() {
            // passphrase is corrent ...
            return auth.storeCredentials();

        }).then(function() {
            // logout of imap
            return privateKey.destroy();

        }).then(function() {
            // continue to main app
            $scope.goTo('/account');

        }).catch(displayError);
    };

    //
    // helper functions
    //

    $scope.goTo = function(location) {
        $location.path(location);
    };

    function displayError(err) {
        $scope.busy = false;
        $scope.incorrect = true;
        $scope.errMsg = err.errMsg || err.message;
    }
};

module.exports = LoginPrivateKeyDownloadCtrl;