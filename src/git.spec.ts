import { parseLogMessage } from "./git";

const messages = [
  "hash<a0000000> ref<> message<fix: some random fix which will be ignored> date<1966-01-01>",
  "hash<a0000001> ref<tag: a-new-hope@4.0.0, tag: empire-strikes-back@5.0.0, tag: return-of-the-jedi@6.0.0> message<fix: some random fix which will be ignored> date<1966-01-01>",
  "hash<a0000002> ref<tag: v0.1.0> message<Merge pull request #1 from star-wars> date<1977-01-01>",
  "hash<a0000003> ref<RC;.;0.1> message<;;fix;;;> date<20001-01-01>",
  "hash<a0000004> ref<RC;.;0.1> message<feat: add <App/>> date<20001-01-01>",
  "hash<a0000005> ref<a-new-rc<1>> message<feat(app): dev -> rc1> date<2020-01-01>",
  "hash<a0000006> ref<a-new-rc<1>> message<feat(app): dev > rc1> date<2020-01-01>",
  "hash<a0000007> ref<<>> message<<>> date<<>>",
  "hash<a0000008> ref<>> message<>> date<>>",
  // nullable results
  "hash<a0000009> ref<a-new-rc<1>> message<feat(app): dev > rc1>",
  "hash<a00000010> ref<a-new-rc<1>>",
  "hash<a0000011>",
  "hash<a0000012> date<2020-01-01>",
];

describe("parseLogMessage", function() {
  it("should return null for empty message", function() {
    expect(parseLogMessage("")).toEqual(null);
  });

  it("should return null for message with invalid format", function() {
    expect(parseLogMessage("hash<a000002 ref<%>")).toEqual(null);
  });

  messages.forEach((message, i) => {
    it("should parse message " + i, function() {
      expect(parseLogMessage(message)).toMatchSnapshot();
    });
  });
});
