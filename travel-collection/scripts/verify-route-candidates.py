#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def require(condition, message):
    if not condition:
        raise AssertionError(message)


routes_js = read("routes.js")
routes_html = read("routes.html")
travel_state_js = read("travel-state.js")

require("route-candidates.js" in routes_html, "routes.html should load route-candidates.js")
require("RouteCandidate" in read("route-candidates.js"), "route-candidates.js should define RouteCandidate behavior")
require("searchOnlineRouteCandidates" in read("route-candidates.js"), "online candidate search API should exist")
require("saveRouteCandidate" in travel_state_js, "travel-state should expose candidate-to-route saving")
require("findSimilarRoute" in travel_state_js, "travel-state should detect duplicate candidate routes")
require("本地路线库暂无相关路线，正在联网查找灵感" in routes_js, "routes page should show online-search loading text")
require("没有找到相关路线灵感" in routes_js, "routes page should show the required no-candidate empty state")
require("联网发现" in routes_js, "candidate cards should show online discovery label")
require("data-route-save-candidate" in routes_js, "candidate cards should include save-to-library action")
require("openAddToTripModal" in routes_js, "candidate add-to-trip should use the existing confirmation modal")
require("nordic-aurora" not in routes_js.split("没有找到相关路线灵感")[-1], "no-result path must not fall back to Nordic route")
require("RouteCandidate" in travel_state_js, "travel-state should include route candidate conversion handling")

print("Route candidate feature static checks passed")
