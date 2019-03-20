define(['persist/simpleJsonShredding', 'persist/impl/logger'],
  function (simpleJsonShredding, logger) {
    'use strict';
    logger.option('level',  logger.LEVEL_LOG);
    QUnit.module('simpleJsonShredding');

    QUnit.test('getShredder()', function (assert) {
      var done = assert.async();
      assert.expect(15);
      var payloadJson = JSON.stringify([{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
            {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
            {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}]);
      var singlePayloadJson = JSON.stringify({DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300});
      var shredder = simpleJsonShredding.getShredder('departments', 'DepartmentId');
      var response = new Response(payloadJson);
      var singleResponse = new Response(singlePayloadJson);
      shredder(response).then(function (shreddedData) {
        assert.ok(shreddedData.length == 1, 'shreddedData contains one item');
        assert.ok(shreddedData[0].name == 'departments', 'shreddedData item storename is departments');
        assert.ok(shreddedData[0].data.length == 3, 'shreddedData item data length is 3');
        assert.ok(shreddedData[0].keys.length == 3, 'shreddedData item keys length is 3');
        var shreddedDataJsonString = JSON.stringify(shreddedData[0].data);
        assert.ok(payloadJson == shreddedDataJsonString, 'shreddedData item data is correct');
        assert.ok(shreddedData[0].keys[0] == 1001, 'shreddedData item keys[0] is correct');
        assert.ok(shreddedData[0].keys[1] == 556, 'shreddedData item keys[0] is correct');
        assert.ok(shreddedData[0].keys[2] == 10, 'shreddedData item keys[0] is correct');
        shredder(singleResponse).then(function (shreddedData) {
          assert.ok(shreddedData.length == 1, 'shreddedData contains one item');
          assert.ok(shreddedData[0].name == 'departments', 'shreddedData item storename is departments');
          assert.ok(shreddedData[0].data.length == 1, 'shreddedData item data length is 1');
          assert.ok(shreddedData[0].keys.length == 1, 'shreddedData item keys length is 1');
          assert.ok(shreddedData[0].resourceType == 'single', 'shreddedData resourceType is single');
          var shreddedDataJsonString = JSON.stringify(shreddedData[0].data);
          assert.ok(JSON.stringify([JSON.parse(singlePayloadJson)]) == shreddedDataJsonString, 'shreddedData item data is correct');
          assert.ok(shreddedData[0].keys[0] == 1001, 'shreddedData item keys[0] is correct');
          done();
        })
      });
    });
    QUnit.test('getShredder() with complex key', function (assert) {
      var done = assert.async();
      assert.expect(15);
      var data = [{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
        {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
        {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}];
      var payloadJson = JSON.stringify(data);
      var singlePayloadJson = JSON.stringify({DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300});
      var shredder = simpleJsonShredding.getShredder('departments', ['DepartmentId', 'LocationId']);
      var response = new Response(payloadJson);
      var singleResponse = new Response(singlePayloadJson);
      shredder(response).then(function (shreddedData) {
        assert.ok(shreddedData.length == 1, 'shreddedData contains one item');
        assert.ok(shreddedData[0].name == 'departments', 'shreddedData item storename is departments');
        assert.ok(shreddedData[0].data.length == 3, 'shreddedData item data length is 3');
        assert.ok(shreddedData[0].keys.length == 3, 'shreddedData item keys length is 3');
        var shreddedDataJsonString = JSON.stringify(shreddedData[0].data);
        assert.ok(JSON.stringify(data) == shreddedDataJsonString, 'shreddedData item data is correct');
        assert.ok(JSON.stringify(shreddedData[0].keys[0]) == JSON.stringify([1001, 200]), 'shreddedData item keys[0] is correct');
        assert.ok(JSON.stringify(shreddedData[0].keys[1]) == JSON.stringify([556, 200]), 'shreddedData item keys[0] is correct');
        assert.ok(JSON.stringify(shreddedData[0].keys[2]) == JSON.stringify([10, 200]), 'shreddedData item keys[0] is correct');
        shredder(singleResponse).then(function (shreddedData) {
          assert.ok(shreddedData.length == 1, 'shreddedData contains one item');
          assert.ok(shreddedData[0].name == 'departments', 'shreddedData item storename is departments');
          assert.ok(shreddedData[0].data.length == 1, 'shreddedData item data length is 1');
          assert.ok(shreddedData[0].keys.length == 1, 'shreddedData item keys length is 1');
          assert.ok(shreddedData[0].resourceType == 'single', 'shreddedData resourceType is single');
          var shreddedDataJsonString = JSON.stringify(shreddedData[0].data);
          assert.ok(JSON.stringify([JSON.parse(singlePayloadJson)]) == shreddedDataJsonString, 'shreddedData item data is correct');
          assert.ok(JSON.stringify(shreddedData[0].keys[0]) == JSON.stringify([1001, 200]), 'shreddedData item keys[0] is correct');
          done();
        })
      });
    });
    QUnit.test('getShredder() with complex key with null', function (assert) {
      var done = assert.async();
      assert.expect(15);
      var data = [{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: null, ManagerId: 300},
        {DepartmentId: 556, DepartmentName: 'BB', LocationId: null, ManagerId: 300},
        {DepartmentId: 10, DepartmentName: 'Administration', LocationId: null, ManagerId: 300}];
      var payloadJson = JSON.stringify(data);
      var singlePayloadJson = JSON.stringify({DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300});
      var shredder = simpleJsonShredding.getShredder('departments', ['DepartmentId', 'LocationId']);
      var response = new Response(payloadJson);
      var singleResponse = new Response(singlePayloadJson);
      shredder(response).then(function (shreddedData) {
        assert.ok(shreddedData.length == 1, 'shreddedData contains one item');
        assert.ok(shreddedData[0].name == 'departments', 'shreddedData item storename is departments');
        assert.ok(shreddedData[0].data.length == 3, 'shreddedData item data length is 3');
        assert.ok(shreddedData[0].keys.length == 3, 'shreddedData item keys length is 3');
        var shreddedDataJsonString = JSON.stringify(shreddedData[0].data);
        assert.ok(JSON.stringify(data) == shreddedDataJsonString, 'shreddedData item data is correct');
        assert.ok(JSON.stringify(shreddedData[0].keys[0]) == JSON.stringify([1001, null]), 'shreddedData item keys[0] is correct');
        assert.ok(JSON.stringify(shreddedData[0].keys[1]) == JSON.stringify([556, null]), 'shreddedData item keys[0] is correct');
        assert.ok(JSON.stringify(shreddedData[0].keys[2]) == JSON.stringify([10, null]), 'shreddedData item keys[0] is correct');
        shredder(singleResponse).then(function (shreddedData) {
          assert.ok(shreddedData.length == 1, 'shreddedData contains one item');
          assert.ok(shreddedData[0].name == 'departments', 'shreddedData item storename is departments');
          assert.ok(shreddedData[0].data.length == 1, 'shreddedData item data length is 1');
          assert.ok(shreddedData[0].keys.length == 1, 'shreddedData item keys length is 1');
          assert.ok(shreddedData[0].resourceType == 'single', 'shreddedData resourceType is single');
          var shreddedDataJsonString = JSON.stringify(shreddedData[0].data);
          assert.ok(JSON.stringify([JSON.parse(singlePayloadJson)]) == shreddedDataJsonString, 'shreddedData item data is correct');
          assert.ok(JSON.stringify(shreddedData[0].keys[0]) == JSON.stringify([1001, 200]), 'shreddedData item keys[0] is correct');
          done();
        })
      });
    });
    QUnit.test('getUnshredder()', function (assert) {
      var done = assert.async();
      assert.expect(2);
      var payload = [{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300},
                     {DepartmentId: 556, DepartmentName: 'BB', LocationId: 200, ManagerId: 300},
                     {DepartmentId: 10, DepartmentName: 'Administration', LocationId: 200, ManagerId: 300}];
      var unshreddedData = [{
        name: 'departments',
        data: payload
      }];
      var singlePayload = [{DepartmentId: 1001, DepartmentName: 'ADFPM 1001 neverending', LocationId: 200, ManagerId: 300}];
      var singleUnshreddedData = [{
        name: 'department',
        data: singlePayload,
        resourceType: 'single'
      }];
      var unshredder = simpleJsonShredding.getUnshredder();
      unshredder(unshreddedData, new Response(null, {
        status: 200,
        statusText: 'OK',
        headers: {'content-type': 'application/json'}})).then(function (response) {
        response.json().then(function (updatedPayload) {
          assert.ok(JSON.stringify(payload) == JSON.stringify(updatedPayload), 'unshredded payload is correct');
          unshredder(singleUnshreddedData, new Response(null, {
            status: 200,
            statusText: 'OK',
            headers: {'content-type': 'application/json'}})).then(function (response) {
            response.json().then(function (updatedPayload) {
              assert.ok(JSON.stringify(singlePayload[0]) == JSON.stringify(updatedPayload), 'unshredded payload is correct');
              done();
            });
          });
        });
      });
    });
  });
