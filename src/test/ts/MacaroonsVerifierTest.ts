/*
 * Copyright 2014 Martin W. Kirst
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/// <reference path="../../typings/tsd.d.ts" />

declare var require; // TODO: bad hack to make TSC compile, possible reason https://github.com/Microsoft/TypeScript/issues/954
var expect = require('expect.js');

import MacaroonsBuilder = require('../../main/ts/MacaroonsBuilder');
import MacaroonsVerifier = require('../../main/ts/MacaroonsVerifier');
import Macaroon = require('../../main/ts/Macaroon');
import TimestampCaveatVerifier = require('../../main/ts/verifier/TimestampCaveatVerifier');

describe('MacaroonsVerifierTest', function () {

  var location = 'http://mybank/';
  var secret:any = 'this is our super secret key; only we should know it';
  var secretBytes = new Buffer('a96173391e6bfa0356bbf095621b8af1510968e770e4d27d62109b7dc374814b', 'hex');
  var identifier = 'we used our secret key';


  it("verify a valid Macaroon with secret string", function () {
    var m = new MacaroonsBuilder(location, secret, identifier).getMacaroon();
    var verifier = new MacaroonsVerifier(m);

    expect(verifier.isValid(secret)).to.be(true);
  });


  it("verify a valid Macaroon with secret Buffer", function () {
    secret = new Buffer(secret, 'ascii');
    var m = new MacaroonsBuilder(location, secret, identifier).getMacaroon();
    var verifier = new MacaroonsVerifier(m);

    expect(verifier.isValid(secret)).to.be(true);
  });


  it("verify a valid Macaroon with assertion with secret string", function () {
    var m = new MacaroonsBuilder(location, secret, identifier).getMacaroon();
    var verifier = new MacaroonsVerifier(m);

    expect(verifier.assertIsValid.bind(verifier)).withArgs(secret).to.not.throwException();
  });


  it("verify a valid Macaroon with assertion with secret Buffer", function () {
    secret = new Buffer(secret, 'ascii');
    var m = new MacaroonsBuilder(location, secret, identifier).getMacaroon();
    var verifier = new MacaroonsVerifier(m);

    expect(verifier.assertIsValid.bind(verifier)).withArgs(secret).to.not.throwException();
  });


  it("verify an invalid Macaroon", function () {
    var m = new MacaroonsBuilder(location, secret, identifier).getMacaroon();
    var verifier = new MacaroonsVerifier(m);

    expect(verifier.isValid("wrong secret")).to.be(false);
  });


  it("verify an invalid Macaroon with assertion", function () {
    var m = new MacaroonsBuilder(location, secret, identifier).getMacaroon();
    var verifier = new MacaroonsVerifier(m);

    expect(verifier.assertIsValid).withArgs("wrong secret").to.throwException();
  });


  it("verification satisfy exact first party caveat", function () {
    var m = new MacaroonsBuilder(location, secret, identifier)
        .add_first_party_caveat("account = 3735928559")
        .getMacaroon();

    var verifier = new MacaroonsVerifier(m);
    expect(verifier.isValid(secret)).to.be(false);

    verifier.satisfyExact("account = 3735928559");
    expect(verifier.isValid(secret)).to.be(true);
  });


  it("verification satisfy exact attenuate with additional caveats", function () {
    var m = new MacaroonsBuilder(location, secret, identifier)
        .add_first_party_caveat("account = 3735928559")
        .getMacaroon();

    var verifier = new MacaroonsVerifier(m);
    expect(verifier.isValid(secret)).to.be(false);

    verifier.satisfyExact("account = 3735928559");
    verifier.satisfyExact("IP = 127.0.0.1')");
    verifier.satisfyExact("browser = Chrome')");
    verifier.satisfyExact("action = deposit");
    expect(verifier.isValid(secret)).to.be(true);
  });


  it("verification general", function () {
    var m = new MacaroonsBuilder(location, secret, identifier)
        .add_first_party_caveat("time < 2020-12-31T18:23:45Z")
        .getMacaroon();

    var verifier = new MacaroonsVerifier(m);
    expect(verifier.isValid(secret)).to.be(false);

    verifier.satisfyGeneral(TimestampCaveatVerifier);
    expect(verifier.isValid(secret)).to.be(true);
  });

});
