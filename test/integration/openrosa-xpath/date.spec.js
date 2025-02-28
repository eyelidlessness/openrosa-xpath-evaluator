const {initDoc, nsResolver, assertMatch, assertFalse, assertString,
  assertBoolean, assertStringValue, assertNumberRounded } = require('../helpers');

describe('#date()', () => {

  describe('invalid dates', () => {
    [
      //TODO "date('1983-09-31')",
      'date("not a date")',
      'date("opv_3")',
      'date(true())'
      //TODO "date(convertible())"
    ].forEach(expr => {
      it(`should convert ${expr} to false`, () => {
        assertFalse(expr);
        // do the same tests for the alias date-time()
        expr = expr.replace('date(', 'date-time(');
        assertFalse(expr);
      });
    });
  });

  describe('valid date string', () => {
    describe('should be left alone', () => {
      [
        [ 'date("1970-01-01")', '1970-01-01' ],
        [ 'date("2018-01-01")', '2018-01-01' ],
        [ '"2018-01-01"', '2018-01-01' ],
      ].forEach(([ expr, expected ]) => {
        it(`should convert ${expr} to ${expected}`, () => {
          assertStringValue(expr, expected);
        });
      });
    });

    describe('dates as string', () => {
      it('example 1', () => {
        assertStringValue('"2018-01-01"', '2018-01-01');
      });
      it('example 2', () => {
        assertStringValue('date("2018-01-01")', '2018-01-01');
      });
      it('example 3', () => {
        assertNumberRounded('"2018-01-01" + 1', 17533.29167, 100000);
      });
      it('example 4', () => {
        assertStringValue('date("2018-01-01" + 1)', '2018-01-02');
      });

      [
        'today()',
        'date(today() + 10)',
        'date(10 + today())'
      ].forEach( expr => {
        it(`should convert ${expr} to a date string`, () => {
          assertMatch(expr, /([0-9]{4}-[0-9]{2}-[0-9]{2})$/ );
        });
      });
    });
  });

  describe('date string with single-digit day or month values', () => {
    it('should insert zeroes', () => {
      assertStringValue('date("1970-1-2")', '1970-01-02');
    });
  });

  describe('number', () => {
    [
      ['date(0)', '1970-01-01'],
      ['date(1)', '1970-01-02'],
      ['date(1.5)', '1970-01-02'],
      ['date(-1)', '1969-12-31'],
    ].forEach(([expr, expected]) => {
      it(expr + ' should be converted to ' + expected, () => {
        assertString(expr, expected);
      });
    });
  });

  describe('invalid date', () => {
    it('should not parse, but instead should return a String', () => {
      assertString("date('nonsense')", 'Invalid Date');
    });
  });

  describe('comparisons', () => {
    [
      ['date("2001-12-26") > date("2001-12-25")', true],
      ['date("2001-12-26") < date("2001-12-25")', false],
      ['date("1969-07-20") < date("1969-07-21")', true],
      ['date("1969-07-20") > date("1969-07-21")', false],
      ['date("2004-05-01") = date("2004-05-01")', true],
      ['date("2004-05-01") != date("2004-05-01")', false],
      ['"string" != date("1999-09-09")', true],
      ['"string" = date("1999-09-09")', false],
      ['date(0) = date("1970-01-01")', true],
      ['date(0) != date("1970-01-01")', false],
      ['date(1) = date("1970-01-02")', true],
      ['date(1) != date("1970-01-02")', false],
      ['date(-1) = date("1969-12-31")', true],
      ['date(-1) != date("1969-12-31")', false],
      ['date(14127) = date("2008-09-05")', true],
      ['date(14127) != date("2008-09-05")', false],
      ['date(-10252) = date("1941-12-07")', true],
      ['date(-10252) != date("1941-12-07")', false],
      ['date("2012-01-01") < today()', true],
      ['date("2012-01-01") > today()', false],
      ['date("2100-01-02") > today()', true],
      ['date("2100-01-02") < today()', false]
    ].forEach(([expr, expected]) => {
      it('should evaluate \'' + expr + '\' to: ' + expected, () => {
        assertBoolean(expr, expected);
      });
    });
  });

  describe('math', () => {
    [
      ['date("2001-12-26") + 5', '2001-12-31'],
      ['date("2001-12-26") - 5', '2001-12-21'],
      ['5 + date("2001-12-26")', '2001-12-31'],
      ['-5 + date("2001-12-26")', '2001-12-21'],
      ['3 + date("2001-12-26") + 5', '2002-01-03'],
      ['3 + date("2001-12-26") - 5', '2001-12-24']
    ].forEach(([expr, expected]) => {
      it('should evaluate \'' + expr + '\' to: ' + expected, () => {
        assertString(expr, expected);
      });
    });
  });

  it('should convert now() to a date string with time component', () => {
    assertMatch('now()', /([0-9]{4}-[0-9]{2}-[0-9]{2})([T]|[\s])([0-9]){2}:([0-9]){2}([0-9:.]*)(\+|-)([0-9]{2}):([0-9]{2})$/);
  });

  describe('converts dates to numbers', () => {
    [
      ["number(date('1970-01-01'))", 0.29],
      ["number(date('1970-01-02'))", 1.29],
      ["number(date('1969-12-31'))", -0.71],
      ["number(date('2008-09-05'))", 14127.29],
      ["number(date('1941-12-07'))", -10251.71],
      ["number('2008-09-05')", 14127.29],
      ["number(1 div 1000000000 )", 0]
   ].forEach(([expr, expected]) => {
      it(`should convert ${expr} to ${expected}`, () => {
        assertNumberRounded(expr, expected, 100);
      });
    });
  });

  describe('for nodes (where the date datatype is guessed)', () => {
    let doc;

    before(() => {
      doc = initDoc(`
        <div id="FunctionDate">
          <div id="FunctionDateCase1">2012-07-23</div>
          <div id="FunctionDateCase2">2012-08-20T00:00:00.00+00:00</div>
          <div id="FunctionDateCase3">2012-08-08T00:00:00+00:00</div>
          <div id="FunctionDateCase4">2012-06-23</div>
          <div id="FunctionDateCase5">2012-08-08T06:07:08.123-07:00</div>
        </div>`, nsResolver);
    });

    [
      [".", "FunctionDateCase1", 15544.29],
      [".", "FunctionDateCase2", 15572]
    ].forEach(([expr, id, expected]) => {
      it(`should convert ${expr} on ${id} to ${expected}`, () => {
        assertNumberRounded(expr, expected, 100, doc.getElementById(id));
      });
    });
  });

  describe('datetype comparisons', () => {
    [
      ["date('2001-12-26') > date('2001-12-25')", true],
      ["date('1969-07-20') < date('1969-07-21')", true],
      ["date('2004-05-01') = date('2004-05-01')", true],
      ["true() != date('1999-09-09T00:00:00.000+00:00')", false],
      ["date(0) = date('1970-01-01T00:00:00.000+00:00')", true],
      ["date(1) = date('1970-01-02T00:00:00.000+00:00')", true],
      ["date(-1) = date('1969-12-31T00:00:00.000+00:00')", true],
      ["date(14127) = date('2008-09-05T00:00:00.000+00:00')", true],
      ["date(-10252) = date('1941-12-07T00:00:00.000+00:00')", true],
      ["date(date('1989-11-09')) = date('1989-11-09')", true],
      ["date('2012-01-01') < today()", true],
      ["date('2100-01-02') > today()", true],
      ["date('2012-01-01') < now()", true],
      ["date('2100-01-02') > now()", true],
      // ["now() > today()", true],
      ['"2018-06-25" = "2018-06-25T00:00:00.000-07:00"', true],
      ['"2018-06-25" < "2018-06-25T00:00:00.000-07:00"', false],
      ['"2018-06-25" < "2018-06-25T00:00:00.001-07:00"', true],
    ].forEach(([expr, expected]) => {
      it(`should convert ${expr} to ${expected}`, () => {
        assertBoolean(expr, expected);
        // do the same tests for the alias date-time()
        expr = expr.replace('date(', 'date-time(' );
        assertBoolean(expr, expected);
      });
    });
  });

  describe('datestring comparisons (date detection)', () => {
    let doc;

    before(() => {
      doc = initDoc(`
        <div id="FunctionDate">
          <div id="FunctionDateCase1">2012-07-23</div>
          <div id="FunctionDateCase2">2012-08-20T00:00:00.00+00:00</div>
          <div id="FunctionDateCase3">2012-08-08T00:00:00+00:00</div>
          <div id="FunctionDateCase4">2012-06-23</div>
          <div id="FunctionDateCase5">2012-08-08T06:07:08.123-07:00</div>
        </div>`);
    });

    [
      [ true, 'FunctionDateCase1', ". < date('2012-07-24')" ],
      //returns false if strings are compared but true if dates are compared
      [ true, 'FunctionDateCase1', "../node()[@id='FunctionDateCase2'] > ../node()[@id='FunctionDateCase3']" ],
    ].forEach(([ expected, id, expr ]) => {
      it(`should convert ${expr} to ${expected}`, () => {
        const node = doc.getElementById(id);
        assertBoolean(node, null, expr, expected);
        expr = expr.replace('date(', 'date-time(');
        assertBoolean(node, null, expr, expected);
      });
    });
  });

  describe('date calculations', () => {
    let doc;

    beforeEach(() => {
      doc = initDoc(`
        <!DOCTYPE html>
        <html xml:lang="en-us" xmlns="http://www.w3.org/1999/xhtml" xmlns:ev="http://some-namespace.com/nss">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <title>xpath-test</title>
          </head>
          <body>
            <div id="FunctionDate">
              <div id="FunctionDateCase1">2012-07-23</div>
              <div id="FunctionDateCase4">2012-06-23</div>
            </div>
          </body>
        </html>`, nsResolver);
    });

    [
      [true, doc, "today() > ('2012-01-01' + 10)" ],
      [true, doc, "10 + date('2012-07-24') = date('2012-08-03')" ],
      [true, 'FunctionDateCase1', ". = date('2012-07-24') - 1" ],
      [true, 'FunctionDateCase1', ". > date('2012-07-24') - 2" ],
      [true, 'FunctionDateCase1', ". < date('2012-07-25') - 1" ],
      [true, 'FunctionDateCase1', ". = 30 + /xhtml:html/xhtml:body/xhtml:div[@id='FunctionDate']/xhtml:div[@id='FunctionDateCase4']" ],
      [true, doc, "10 + '2012-07-24' = '2012-08-03'" ],
    ].forEach(([ expected, node, expr ]) => {
      it(`should convert ${expr} to ${expected}`, () => {
        if(node !== doc) node = doc.getElementById(node);
        assertBoolean(node, null, expr, expected);
        // do the same tests for the alias date-time()
        expr = expr.replace('date(', 'date-time(');
        assertBoolean(node, null, expr, expected);
      });
    });

    [
      ['10 + date("2012-07-24")', doc, 15555.29],
    ].forEach(([expr, node, expected]) => {
      it(`should convert ${expr} to ${expected}`, () => {
        assertNumberRounded(expr, expected, 100, node);
        // do the same tests for the alias date-time()
        expr = expr.replace('date(', 'date-time(' );
        assertNumberRounded(expr, expected, 100, node);
      });
    });
  });
});
